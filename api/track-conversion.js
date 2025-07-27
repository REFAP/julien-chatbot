export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Test GET
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'API Working', 
      time: new Date().toISOString() 
    });
  }
  
  // Handle POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📧 Données reçues:', JSON.stringify(req.body, null, 2));
    
    const webhookUrl = 'https://hooks.airtable.com/workflows/v1/genericWebhook/appGeEstBq3KYfqcq/wflouM2MWSvqLNiWB/wtrqBfGa4RaTglY1w';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    console.log('📊 Statut Airtable:', response.status);
    
    if (response.ok) {
      console.log('✅ Succès Airtable');
      return res.status(200).json({ 
        success: true, 
        message: 'Lead envoyé vers Airtable avec succès' 
      });
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur Airtable:', errorText);
      return res.status(500).json({ 
        error: 'Erreur Airtable', 
        details: errorText,
        status: response.status
      });
    }
  } catch (error) {
    console.error('💥 Erreur API:', error);
    return res.status(500).json({ 
      error: 'Erreur réseau', 
      message: error.message 
    });
  }
}
