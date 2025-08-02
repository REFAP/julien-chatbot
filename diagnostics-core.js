// diagnostics-core.js
import Airtable from "airtable";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// --- utilitaires ---
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedding(text) {
  if (!text) return null;
  const resp = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return resp.data[0].embedding;
}

// --- 1. refresh embeddings existantes ---
export async function refreshAllEmbeddings({ force = false } = {}) {
  const toUpdate = [];
  await base("CAS_DIAGNOSTIC").select({ view: "Grid view" }).eachPage(async (records, fetchNext) => {
    for (const record of records) {
      const hasEmbedding = record.get("Embedding");
      if (hasEmbedding && !force) continue; // skip si déjà présent sauf override

      const sympt = record.get("Symptômes") || "";
      const causes = record.get("Causes_probables") || "";
      const solution = record.get("Solution_Proposée") || "";
      const context = `${sympt} ${causes} ${solution}`.trim();
      if (!context) continue;

      const embedding = await getEmbedding(context);
      toUpdate.push({
        id: record.id,
        fields: {
          Embedding: JSON.stringify(embedding),
        },
      });

      if (toUpdate.length === 10) {
        await base("CAS_DIAGNOSTIC").update(toUpdate);
        toUpdate.length = 0;
      }
    }
    if (toUpdate.length) {
      await base("CAS_DIAGNOSTIC").update(toUpdate);
    }
    fetchNext();
  });
  console.log("✅ Embeddings refreshés.");
}

// --- 2. récupération et matching ---
let cachedCases = null; // simple cache in-memory

export async function fetchAllCasesCached() {
  if (cachedCases) return cachedCases;
  const records = [];
  await base("CAS_DIAGNOSTIC").select({ view: "Grid view" }).eachPage((page, fetchNext) => {
    page.forEach(r => {
      let embedding = null;
      try {
        const raw = r.get("Embedding");
        if (raw) embedding = JSON.parse(raw);
      } catch {}
      records.push({
        id: r.id,
        fields: r.fields,
        embedding,
      });
    });
    fetchNext();
  });
  cachedCases = records;
  return records;
}

export async function findBestMatches(userInput, topK = 3) {
  const allCases = await fetchAllCasesCached();
  const userContext = `${userInput.symptomes || ""} ${userInput.codesErreur || ""} ${userInput.vehicule || ""}`.trim();
  const userEmbedding = await getEmbedding(userContext);

  const scored = allCases.map(c => {
    let score = 0;
    // match code erreur exact
    if (userInput.codesErreur && c.fields.Codes_Erreur) {
      const userCodes = userInput.codesErreur
        .split(",")
        .map(s => s.trim().toUpperCase());
      const caseCodes = c.fields.Codes_Erreur
        .split(",")
        .map(s => s.trim().toUpperCase());
      if (userCodes.some(code => caseCodes.includes(code))) {
        score += 0.6; // boost fort
      }
    }

    if (userEmbedding && c.embedding) {
      const sim = cosineSimilarity(userEmbedding, c.embedding);
      score += 0.4 * sim; // pondération
    }

    return { case: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// --- 3. fallback GPT et enrichissement ---
function buildFallbackPrompt(userInput, topMatches) {
  const similarText = topMatches
    .map(m => {
      const f = m.case.fields;
      return `- ${f.ID_Cas || m.case.id}: Symptômes: ${f.Symptômes || "N/A"} | Solution: ${f.Solution_Proposée || "N/A"}`;
    })
    .join("\n");

  return `
Tu es un mécano expérimenté, direct et crédible. L’utilisateur a ce contexte :
- Symptômes : ${userInput.symptomes || "non précisé"}
- Codes erreur : ${userInput.codesErreur || "aucun"}
- Véhicule : ${userInput.vehicule || "non précisé"}

Cas similaires déjà connus :
${similarText || "aucun"}

Donne une réponse structurée au format JSON avec ces clés :
1. "Diagnostic_probable" : court résumé
2. "Causes_possibles" : liste ou chaîne
3. "Solution_recommandée" : ce qu'il faut faire (prioriser Re-FAP / partenaire si c’est pertinent)
4. "Conseils_pratiques"
5. "Différence_avec_cas_connus" : ce qui fait que c’est spécifique
6. "Ton" : style (ex. "Mécano cash")

Répond uniquement en JSON, sans explication supplémentaire.`;
}

async function callGPT(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o", // ou gpt-4 si tu as accès, adapte si tu veux moins cher
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 500,
  });
  return completion.choices[0].message.content.trim();
}

export async function handleUserQuery(userInput) {
  // userInput = { symptomes: "", codesErreur: "", vehicule: "" }
  const matches = await findBestMatches(userInput, 3);
  const best = matches[0];
  const threshold = 0.75; // tu peux ajuster

  if (best.score >= threshold) {
    return {
      source: "base",
      score: best.score,
      réponse: best.case.fields.Réponse_formattée,
      cas: best.case.fields,
    };
  }

  // fallback GPT
  const prompt = buildFallbackPrompt(userInput, matches);
  const gptRaw = await callGPT(prompt);

  // tente de parser le JSON renvoyé
  let parsed;
  try {
    parsed = JSON.parse(gptRaw);
  } catch (e) {
    // si échec, on fallback sur un champ brut
    parsed = {
      Diagnostic_probable: "À extraire manuellement",
      Causes_possibles: "",
      Solution_recommandée: "",
      Conseils_pratiques: "",
      Différence_avec_cas_connus: "",
      Ton: "Mécano cash",
      raw: gptRaw,
    };
  }

  // enregistrer le cas brut pour révision
  const newCaseFields = {
    ID_Cas: `AUTO_${Date.now()}`,
    Symptômes: userInput.symptomes,
    Codes_Erreur: userInput.codesErreur || "",
    Causes_probables: parsed.Causes_possibles || "",
    Diagnostic_conseillé: parsed.Diagnostic_probable || "",
    Solution_Proposée: parsed.Solution_recommandée || "",
    Réponse_formattée: gptRaw,
    Ton_de_réponse: parsed.Ton || "Mécano cash",
    Validé: false,
    Date_creation: new Date().toISOString().split("T")[0],
    Source: "GPT fallback",
    Lien_CTA: "https://auto.re-fap.fr",
  };

  await base("CAS_DIAGNOSTIC").create([{ fields: newCaseFields }]);

  return {
    source: "gpt",
    score: best.score,
    parsed,
    raw: gptRaw,
  };
}
