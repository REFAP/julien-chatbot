export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'API Working', 
      time: new Date().toISOString() 
    });
  }
  
  if (req.method === 'POST') {
    try {
      console.log('📧 POST reçu');
      console.log('📦 Body:', req.body);
      
      // Test sans appel vers Airtable d'abord
      return res.status(200).json({ 
        success: true, 
        message: 'API POST fonctionne',
        received: req.body
      });
      
    } catch (error) {
      console.error('💥 Erreur POST:', error);
      return res.status(500).json({ 
        error: 'Erreur dans POST', 
        message: error.message 
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
