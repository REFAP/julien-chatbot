// diagnostics-core.js
import OpenAI from "openai";

// --- configuration / variables d'environnement ---
const openaiKey = process.env.OPENAI_API_KEY || process.env.CLÉ_API_OPENAI;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = "CAS_DIAGNOSTIC"; // nom exact de la table Airtable

if (!openaiKey) throw new Error("Missing OpenAI API key (OPENAI_API_KEY or CLÉ_API_OPENAI).");
if (!AIRTABLE_TOKEN) throw new Error("Missing Airtable personal access token (AIRTABLE_TOKEN).");
if (!AIRTABLE_BASE_ID) throw new Error("Missing Airtable base ID (AIRTABLE_BASE_ID).");

const openai = new OpenAI({ apiKey: openaiKey });

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

// --- Airtable REST helpers ---
async function airtableList(params = {}) {
  const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Airtable list error ${res.status}: ${txt}`);
  }
  return res.json();
}

async function airtableCreate(fields) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Airtable create error ${res.status}: ${txt}`);
  }
  return res.json();
}

async function airtableUpdate(recordId, fields) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ id: recordId, fields }] }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Airtable update error ${res.status}: ${txt}`);
  }
  return res.json();
}

// --- refresh des embeddings existants ---
let cachedCases = null;

export async function refreshAllEmbeddings({ force = false } = {}) {
  let offset;
  do {
    const params = { view: "Grid view", pageSize: 100 };
    if (offset) params.offset = offset;
    const data = await airtableList(params);
    for (const record of data.records) {
      const hasEmbedding = record.fields.Embedding;
      if (hasEmbedding && !force) continue;
      const sympt = record.fields.Symptômes || "";
      const causes = record.fields.Causes_probables || "";
      const solution = record.fields.Solution_Proposée || "";
      const context = `${sympt} ${causes} ${solution}`.trim();
      if (!context) continue;
      try {
        const embedding = await getEmbedding(context);
        await airtableUpdate(record.id, { Embedding: JSON.stringify(embedding) });
      } catch (err) {
        console.warn("Erreur embedding pour record", record.id, err.message);
      }
    }
    offset = data.offset;
  } while (offset);
  cachedCases = null;
  console.log("✅ Embeddings refreshés.");
}

export async function fetchAllCasesCached() {
  if (cachedCases) return cachedCases;
  const all = [];
  let offset;
  do {
    const params = { view: "Grid view", pageSize: 100 };
    if (offset) params.offset = offset;
    const data = await airtableList(params);
    for (const r of data.records) {
      let embedding = null;
      try {
        if (r.fields.Embedding) embedding = JSON.parse(r.fields.Embedding);
      } catch {}
      all.push({
        id: r.id,
        fields: r.fields,
        embedding,
      });
    }
    offset = data.offset;
  } while (offset);
  cachedCases = all;
  return cachedCases;
}

// --- matching ---
export async function findBestMatches(userInput, topK = 3) {
  const allCases = await fetchAllCasesCached();
  const userContext = `${userInput.symptomes || ""} ${userInput.codesErreur || ""} ${userInput.vehicule || ""}`.trim();
  const userEmbedding = await getEmbedding(userContext);

  const scored = allCases.map((c) => {
    let score = 0;
    if (userInput.codesErreur && c.fields.Codes_Erreur) {
      const userCodes = userInput.codesErreur
        .split(",")
        .map((s) => s.trim().toUpperCase());
      const caseCodes = (c.fields.Codes_Erreur || "")
        .split(",")
        .map((s) => s.trim().toUpperCase());
      if (userCodes.some((code) => caseCodes.includes(code))) {
        score += 0.6;
      }
    }
    if (userEmbedding && c.embedding) {
      const sim = cosineSimilarity(userEmbedding, c.embedding);
      score += 0.4 * sim;
    }
    return { case: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// --- prompt builder ---
function buildFallbackPrompt(userInput, topMatches) {
  const similarText = topMatches
    .map((m) => {
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
3. "Solution_recommandée" : ce qu'il faut faire (prioriser Re-FAP / partenaire si pertinent)
4. "Conseils_pratiques"
5. "Différence_avec_cas_connus" : ce qui fait que c’est spécifique
6. "Ton" : style (ex. "Mécano cash")

Répond uniquement en JSON, sans explication supplémentaire.`;
}

// --- appel GPT ---
async function callGPT(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 500,
  });
  return completion.choices[0].message.content.trim();
}

// --- gestion de la requête utilisateur ---
export async function handleUserQuery(userInput) {
  const matches = await findBestMatches(userInput, 3);
  const best = matches[0];
  const threshold = 0.75;

  if (best && best.score >= threshold) {
    return {
      source: "base",
      score: best.score,
      réponse: best.case.fields.Réponse_formattée,
      cas: best.case.fields,
    };
  }

  const prompt = buildFallbackPrompt(userInput, matches);
  const gptRaw = await callGPT(prompt);

  let parsed;
  try {
    parsed = JSON.parse(gptRaw);
  } catch (e) {
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

  const newCaseFields = {
    ID_Cas: `AUTO_${Date.now()}`,
    Symptômes: userInput.symptomes || "",
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

  try {
    await airtableCreate(newCaseFields);
  } catch (err) {
    console.warn("Échec création fallback case Airtable:", err.message);
  }

  return {
    source: "gpt",
    score: best ? best.score : 0,
    parsed,
    raw: gptRaw,
  };
}
