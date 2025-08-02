// test-query.js
import 'dotenv/config';
import { refreshAllEmbeddings, handleUserQuery } from "./diagnostics-core.js";

async function main() {
  console.log("→ OpenAI key:", !!(process.env.OPENAI_API_KEY || process.env.CLÉ_API_OPENAI));
  console.log("→ Airtable token:", !!process.env.AIRTABLE_TOKEN);
  console.log("→ Airtable base ID:", process.env.AIRTABLE_BASE_ID);
  console.log("→ Airtable token preview:", process.env.AIRTABLE_TOKEN ? process.env.AIRTABLE_TOKEN.slice(0, 8) + "… (len=" + process.env.AIRTABLE_TOKEN.trim().length + ")" : null);

  try {
    console.log(">> Lancement du refresh des embeddings...");
    await refreshAllEmbeddings();
    console.log(">> Refresh terminé.");
  } catch (e) {
    console.error("Erreur pendant refreshAllEmbeddings:", e);
  }

  try {
    const userInput = {
      symptomes: "Voyant moteur + perte de puissance",
      codesErreur: "P2002",
      vehicule: "Peugeot 308 2011",
    };
    console.log(">> Envoi de la requête utilisateur :", userInput);
    const result = await handleUserQuery(userInput);
    console.log("=== Résultat du test ===");
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Erreur handleUserQuery:", e);
  }
}

main();
