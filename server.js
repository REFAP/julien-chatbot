import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// adapte l'import selon ce que tu exportes vraiment dans diagnostics-core.js
import { refreshAllEmbeddings, queryDiagnostic } from './diagnostics-core.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// exemple d'endpoint de diagnostic
app.post('/diagnose', async (req, res) => {
  try {
    const { inputText } = req.body;
    if (!inputText) return res.status(400).json({ error: 'inputText manquant' });

    // selon ton code, adapte : ici on suppose que tu as une fonction pour interroger la base
    const result = await queryDiagnostic(inputText);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Erreur interne' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server démarré sur http://localhost:${PORT}`);
});
