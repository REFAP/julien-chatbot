export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    claude: { status: 'unknown', error: null },
    openai: { status: 'unknown', error: null }
  };

  // Test Claude
  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Dis juste "Claude fonctionne"' }]
      })
    });

    if (claudeResponse.ok) {
      const data = await claudeResponse.json();
      results.claude = { status: 'success', response: data.content[0].text };
    } else {
      results.claude = { status: 'error', error: `HTTP ${claudeResponse.status}` };
    }
  } catch (error) {
    results.claude = { status: 'error', error: error.message };
  }

  // Test OpenAI
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Dis juste "OpenAI fonctionne"' }],
        max_tokens: 100
      })
    });

    if (openaiResponse.ok) {
      const data = await openaiResponse.json();
      results.openai = { status: 'success', response: data.choices[0].message.content };
    } else {
      results.openai = { status: 'error', error: `HTTP ${openaiResponse.status}` };
    }
  } catch (error) {
    results.openai = { status: 'error', error: error.message };
  }

  return res.status(200).json({
    success: true,
    tests: results,
    recommendations: generateRecommendations(results)
  });
}

function generateRecommendations(results) {
  const recommendations = [];
  
  if (results.claude.status === 'error') {
    recommendations.push('🔑 Vérifiez votre clé CLAUDE_API_KEY dans Vercel');
  }
  
  if (results.openai.status === 'error') {
    recommendations.push('🔑 Vérifiez votre clé OPENAI_API_KEY dans Vercel');
  }
  
  if (results.claude.status === 'success' && results.openai.status === 'success') {
    recommendations.push('🎉 Toutes les APIs fonctionnent ! Dual Brain prêt !');
  }
  
  return recommendations;
}
