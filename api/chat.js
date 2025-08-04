export default function handler(req, res) {
  const { method } = req;
  
  if (method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  // Réponse pour toutes les autres méthodes
  return res.status(200).json({
    success: true,
    response: "Bonjour de l'API !",
    confidence: 0.5,
    top_causes: [],
    ctas: [],
    session_state: 'active',
    current_progress: 0
  });
}
