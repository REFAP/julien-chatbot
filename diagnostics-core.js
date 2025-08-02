// diagnostics-core.js
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

// --- validations ---
const openaiKey = process.env.OPENAI_API_KEY;
const airtableToken = process.env.AIRTABLE_API_KEY; // ton PAT Airtable
const airtableBaseId = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.TABLE_NAME;

if (!openaiKey) throw new Error("Missing OpenAI API key (OPENAI_API_KEY).");
if (!airtableToken) throw new Error("Missing Airtable token (AIRTABLE_API_KEY).");
if (!airtableBaseId) throw new Error("Missing Airtable base ID (AIRTABLE_BASE_ID).");
if (!TABLE_NAME) throw new Error("Missing Airtable table name (TABLE_NAME).");

const openai = new OpenAI({ apiKey: openaiKey });

// --- utilitaires ---
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
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

// Parse éventuellement l'embedding stocké (chaîne JSON ou tableau)
function parseEmbedding(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && raw.embedding) return raw.embedding;
  try {
    return JSON.parse(raw);
  } catch {
    // tentatives secondaires (guillemets simples -> doubles)
    try {
      const cleaned = raw.replace(/'/g, '"');
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

// --- Airtable REST helpers ---
const AIRTABLE_API_BASE = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(
  TABLE_NAME
)}`;
const airtableHeaders = {
  Authorization: `Bearer ${airtableToken}`,
  "Content-Type": "application/json",
};

async function airtableListAll() {
  let records = [];
  let offset = undefined;
  do {
    const url = new URL(AIRTABLE_API_BASE);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: airtableHeaders,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Airtable list error ${res.status}: ${text}`);
    }
    const data = JSON.parse(text);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

async function airtableUpdateEmbedding(recordId, embeddingArray) {
  const body = {
    fields: {
      Embedding: JSON.stringify(embeddingArray),
    },
  };
  const res = await fetch(`${AIRTABLE_API_BASE}/${recordId}`, {
    method: "PATCH",
    headers: airtableHeaders,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.warn(
      `Failed updating embedding for ${recordId}: ${res.status} ${text}`
    );
    return null;
  }
  return JSON.parse(text);
}

// --- cache simple en mémoire ---
let cachedCases = null;

// récupère et met en cache toutes les fiches
async function fetchAllCases() {
  if (cachedCases) return cachedCases;
  const records = await airtableListAll();
  cachedCases = records.map((r) => ({
    id: r.id,
    fields: r.fields,
  }));
  return cachedCases;
}

// force le rafraîchissement des embeddings dans Airtable à partir d'une source de texte (ici Réponse_formattée)
export async function refreshAllEmbeddings() {
  const cases = await fetchAllCases();
  for (const c of cases) {
    try {
      const sourceText =
        c.fields.Réponse_formattée ||
        c.fields.Diagnostic_conseillé ||
        c.fields["Réponse_formattée"] ||
        "";
      if (!sourceText) continue;
      const emb = await getEmbedding(sourceText);
      if (!emb) continue;
      await airtableUpdateEmbedding(c.id, emb);
      // petite pause pour ne pas trop écraser l'API si nécessaire
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.warn("Erreur pendant refreshAllEmbeddings pour", c.id, e);
    }
  }
  // invalide cache pour que les prochains query reprennent à jour
  cachedCases = null;
  return { refreshed: true };
}

// interroge en comparant l'inputText avec les cas existants via cosine similarity
export async function queryDiagnostic(inputText) {
  if (!inputText) {
    throw new Error("inputText requis pour queryDiagnostic");
  }

  const inputEmbedding = await getEmbedding(inputText);
  if (!inputEmbedding) {
    throw new Error("Impossible de calculer l'embedding de l'entrée");
  }

  const cases = await fetchAllCases();
  let best = null;
  let bestScore = -1;

  for (const c of cases) {
    const rawEmb = c.fields.Embedding;
    const caseEmbedding = parseEmbedding(rawEmb);
    if (!caseEmbedding) continue;
    const score = cosineSimilarity(inputEmbedding, caseEmbedding);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  if (!best) {
    return {
      source: "base",
      score: 0,
      réponse: "Aucun cas pertinent trouvé.",
      cas: null,
    };
  }

  // construis la réponse finale
  return {
    source: "base",
    score: bestScore,
    réponse:
      best.fields.Réponse_formattée ||
      best.fields["Réponse_formattée"] ||
      best.fields.Diagnostic_conseillé ||
      "",
    cas: best.fields,
  };
}
