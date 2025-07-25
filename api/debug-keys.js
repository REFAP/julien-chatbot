export default async function handler(req, res) {
  const results = {
    claude: { status: 'unknown', details: null },
    openai: { status: 'unknown', details: null }
  };

  // Test Claude
  try {
    console.log('Testing Claude with key:', process.env.CLAUDE_API_KEY?.substring(0, 20) + '...');
    
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Dis simplement "Claude OK"' }]
      })
    });

    results.claude.status = claudeResponse.status;
    
    if (claudeResponse.ok) {
      const data = await claudeResponse.json();
      results.claude.details = { success: true, response: data.content[0].text };
    } else {
      const errorText = await claudeResponse.text();
      results.claude.details = { success: false, error: errorText };
    }
  } catch (error) {
    results.claude = { status: 'error', details: error.message };
  }

  // Test OpenAI
  try {
    console.log('Testing OpenAI with key:', process.env.CLÉ_API_OPENAI?.substring(0, 20) + '...');
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CLÉ_API_OPENAI}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Dis simplement "OpenAI OK"' }],
        max_tokens: 50
      })
    });

    results.openai.status = openaiResponse.status;
    
    if (openaiResponse.ok) {
      const data = await openaiResponse.json();
      results.openai.details = { success: true, response: data.choices[0].message.content };
    } else {
      const errorText = await openaiResponse.text();
      results.openai.details = { success: false, error: errorText };
    }
  } catch (error) {
    results.openai = { status: 'error', details: error.message };
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    keyPresence: {
      claude: !!process.env.CLAUDE_API_KEY,
      openai: !!process.env.CLÉ_API_OPENAI
    },
    results,
    interpretation: interpretResults(results)
  });
}

function interpretResults(results) {
  const interpretations = [];
  
  if (results.claude.status === 401) {
    interpretations.push('❌ Claude: Clé API invalide ou expirée');
  } else if (results.claude.status === 429) {
    interpretations.push('💰 Claude: Quota dépassé ou rate limit');
  } else if (results.claude.details?.success) {
    interpretations.push('✅ Claude: Fonctionne parfaitement !');
  }
  
  if (results.openai.status === 401) {
    interpretations.push('❌ OpenAI: Clé API invalide ou expirée');
  } else if (results.openai.status === 429) {
    interpretations.push('💰 OpenAI: Quota dépassé ou rate limit');
  } else if (results.openai.details?.success) {
    interpretations.push('✅ OpenAI: Fonctionne parfaitement !');
  }
  
  return interpretations;
}
