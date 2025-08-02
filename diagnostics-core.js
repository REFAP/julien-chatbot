// diagnostics-core.js
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fetch from 'node:fetch'; // Node 18+ a fetch global, mais on peut l'utiliser directement.

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.TABLE_NAME || 'CAS_DIAGNOSTIC';

if (!OPENAI_API_KEY) throw new Error('Missing OpenAI API key (OPENAI_API_KEY).');
if (!AIRTABLE_API_KEY) throw new Error('Missing Airtable API key/token (AIRTABLE_API_KEY or AIRTABLE_TOKEN).');
if (!AIRTABLE_BASE_ID) throw new Error('Missing Airtable base ID (AIRTABLE_BASE_ID).');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// -- utilitaires embeddings / similarité --

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
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
    model: 'text-embedding-ada-002',
    input: text,
  });
  return resp.data[0].embedding;
}

// --- helpers Airtable via REST (pour pouvoir patcher facilement) ---
const airtableBaseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
  TABLE_NAME
)}`;
const airtableHeaders = {
  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
};

async function airtableListAll() {
  // pagination automatique
  let records = [];
  let offset = undefined;
  do {
    const url = new URL(airtableBaseUrl);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: airtableHeaders,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Airtable list error ${res.status}: ${text}`);
    }
    const data = await res.json();
    records = records.concat(data.records || []);
    offset = data.offset;
  } while (offset);
  return records;
}

async function airtableUpdate(recordId, fields) {
  const url = `${airtableBaseUrl}/${recordId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: airtableHeaders,
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable update error ${res.status}: ${text}`);
  }
  return res.json();
}

// --- logique principale ---

/**
 * Parcourt tous les cas et complète les embeddings manquants dans Airtable.
 */
export async function refreshAllEmbeddings() {
  const all = await airtableListAll();
  for (const rec of all) {
    const fields = rec.fields || {};
    let embedding = fields.Embedding;

    // Normaliser : si c'est une string, essayer de parser, sinon s'il n'existe pas on génère
    let parsedEmbedding = null;
    if (embedding) {
      if (typeof embedding === 'string') {
        try {
          parsedEmbedding = JSON.parse(embedding);
        } catch {}
      } else if (Array.isArray(embedding)) {
        parsedEmbedding = embedding;
      }
    }

    if (!parsedEmbedding) {
      // créer un texte représentatif (tu peux ajuster ce que tu combines)
      const textToEmbed = [
        fields.Symptômes,
        fields.Codes_Erreur,
        fields.Causes_probables,
        fields.Diagnostic_conseillé,
      ]
        .filter(Boolean)
        .join(' | ');
      const newEmbedding = await getEmbedding(textToEmbed);
      if (newEmbedding) {
        // on stocke sous forme de chaîne pour éviter de casser les types
        await airtableUpdate(rec.id, { Embedding: JSON.stringify(newEmbedding) });
      }
    }
  }
}

/**
 * Cherche le cas le plus proche dans la base à partir du texte d'entrée.
 * @param {string} inputText
 */
export async function queryDiagnostic(inputText) {
  if (!inputText) throw new Error('inputText requis pour queryDiagnostic');

  // embedding de la requête
  const queryEmbedding = await getEmbedding(inputText);

  // charger tous les cas
  const all = await airtableListAll();

  let best = null;

  for (const rec of all) {
    const fields = rec.fields || {};
    let embedding = fields.Embedding;
    let parsedEmbedding = null;
    if (embedding) {
      if (typeof embedding === 'string') {
        try {
          parsedEmbedding = JSON.parse(embedding);
        } catch {}
      } else if (Array.isArray(embedding)) {
        parsedEmbedding = embedding;
      }
    }
    if (!parsedEmbedding) continue; // on skip si pas d'embedding

    const score = cosineSimilarity(queryEmbedding, parsedEmbedding);
    if (!best || score > best.score) {
      best = {
        score,
        cas: fields,
      };
    }
  }

  if (!best) {
    return {
      source: 'base',
      score: 0,
      réponse: "Aucun cas pertinent trouvé.",
      cas: null,
    };
  }

  // formater la réponse rapide (tu peux l'ajuster)
  const réponseFormatted =
    best.cas.Réponse_formattée ||
    "Un voyant ou symptôme comme celui-ci cache souvent un problème sérieux. Il faut analyser et traiter rapidement.";

  return {
    source: 'base',
    score: best.score,
    réponse: réponseFormatted,
    cas: best.cas,
  };
}
