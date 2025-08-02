// test-query.js
import 'dotenv/config';
import { refreshAllEmbeddings, handleUserQuery } from "./diagnostics-core.js";

async function main() {
  console.log("→ OpenAI key:", !!(process.env.OPENAI_API_KEY || process.env.CLÉ_API_OPENAI));
  console.log("→ Airtable token:", !!process.env.AIRTABLE_TOKEN);
  console.log("→ Airtable base ID:", process.env.AIRTABLE_BASE_ID);

  await refreshAllEmbeddings();

  const userInput = {
    symptomes: "Voyant moteur + perte de puissance",
    codesErreur: "P2002",
    vehicule: "Peugeot 308 2011",
  };

  const result = await handleUserQuery(userInput);
  console.log("=== Résultat du test ===");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error("Erreur test:", e);
});
