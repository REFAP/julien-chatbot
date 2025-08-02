// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { handleUserQuery } from './diagnostics-core.js'; // vérifie que ce nom d'export existe

const app = express();
app.use(cors());
app.use(express.json());

app.post('/diagnose', async (req, res) => {
  try {
    const payload = req.body; // ex: { symptome: "...", code: "P2002" }
    if (!payload) return res.status(400).json({ ok: false, error: 'Payload manquant' });

    const result = await handleUserQuery(payload);
    res.json({ ok: true, result });
  } catch (err) {
    console.error('Erreur /diagnose:', err);
    res.status(500).json({ ok: false, error: err.message || 'Erreur interne' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API diagnostique en écoute sur http://localhost:${port}`);
});
