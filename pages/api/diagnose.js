// pages/api/diagnose.js
import 'dotenv/config';
import { handleUserQuery } from '../../diagnostics-core.js'; // ajuste le chemin si besoin

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  const payload = req.body;
  if (!payload) {
    return res.status(400).json({ error: 'Missing body' });
  }

  try {
    const result = await handleUserQuery(payload);
    return res.status(200).json({ ok: true, result });
  } catch (e) {
    console.error('API diagnose error:', e);
    return res.status(500).json({ ok: false, error: e.message || 'Internal error' });
  }
}
