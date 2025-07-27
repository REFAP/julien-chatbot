export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://hooks.airtable.com/workflows/v1/genericWebhook/appGeEstBq3KYfqcq/wflouM2MWSvqLNiWB/wtrqBfGa4RaTglY1w', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: 'Airtable error' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Network error' });
  }
}
