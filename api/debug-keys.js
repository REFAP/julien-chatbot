// api/debug-keys.js - VERSION CORRIGÉE DÉFINITIVEMENT
// REMPLACEZ VOTRE FICHIER ACTUEL PAR CELUI-CI

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔧 Test des clés API - VERSION CORRIGÉE');

  const results = {
    claude: { status: 'unknown', error: null },
    openai: { status: 'unknown', error: null }
  };

  // === TEST CLAUDE - CORRIGÉ ===
  try {
    console.log('Testing Claude...');
    
    // CORRECTION 1: Utiliser le bon nom de variable
    const claudeKey = process.env.CLAUDE_API_KEY;
    
    if (!claudeKey) {
      results.claude = { 
        status: 'VARIABLE_MISSING', 
        error: 'CLAUDE_API_KEY variable not found in Vercel' 
      };
    } else {
      console.log('Claude key found, length:', claudeKey.length);
      console.log('Claude key prefix:', claudeKey.substring(0, 12) + '...');
      
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,  // CORRECTION 2: Bon header
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test' }]
        })
      });

      results.claude.status = claudeResponse.status;
      
      if (claudeResponse.ok) {
        const data = await claudeResponse.json();
        results.claude.details = { success: true, response: 'Claude OK' };
        console.log('✅ Claude test SUCCESS');
      } else {
        const errorText = await claudeResponse.text();
        results.claude.details = { success: false, error: errorText };
        console.log('❌ Claude test FAILED:', claudeResponse.status, errorText);
      }
    }
  } catch (error) {
    results.claude = { status: 'NETWORK_ERROR', details: error.message };
    console.log('💥 Claude test ERROR:', error.message);
  }

  // === TEST OPENAI - CORRIGÉ ===
  try {
    console.log('Testing OpenAI...');
    
    // CORRECTION 3: Utiliser le bon nom de variable (votre nom personnalisé)
    const openaiKey = process.env.CLE_API_OPENAI;
    
    if (!openaiKey) {
      results.openai = { 
        status: 'VARIABLE_MISSING', 
        error: 'CLE_API_OPENAI variable not found in Vercel' 
      };
    } else {
      console.log('OpenAI key found, length:', openaiKey.length);
      console.log('OpenAI key prefix:', openaiKey.substring(0, 12) + '...');
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`  // CORRECTION 4: Format Bearer correct
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',  // CORRECTION 5: Modèle moins cher pour test
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        })
      });

      results.openai.status = openaiResponse.status;
      
      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        results.openai.details = { success: true, response: 'OpenAI OK' };
        console.log('✅ OpenAI test SUCCESS');
      } else {
        const errorText = await openaiResponse.text();
        results.openai.details = { success: false, error: errorText };
        console.log('❌ OpenAI test FAILED:', openaiResponse.status, errorText);
      }
    }
  } catch (error) {
    results.openai = { status: 'NETWORK_ERROR', details: error.message };
    console.log('💥 OpenAI test ERROR:', error.message);
  }

  // === DIAGNOSTIC COMPLET ===
  console.log('=== DIAGNOSTIC FINAL ===');
  console.log('Claude status:', results.claude.status);
  console.log('OpenAI status:', results.openai.status);

  // Variables disponibles (pour debug)
  const availableVars = {
    CLAUDE_API_KEY: !!process.env.CLAUDE_API_KEY,
    CLE_API_OPENAI: !!process.env.CLE_API_OPENAI,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY, // Au cas où vous auriez les deux
    RESEND_API_KEY: !!process.env.RESEND_API_KEY
  };

  console.log('Variables disponibles:', availableVars);

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    keyPresence: availableVars,
    results,
    interpretation: interpretResults(results),
    
    // SOLUTION DÉFINITIVE
    SOLUTION: results.claude.status === 200 && results.openai.status === 200 ? 
      '🎉 TOUTES LES APIS FONCTIONNENT - PROBLÈME RÉSOLU !' : 
      '🔧 Utilisez les recommandations ci-dessous',
      
    recommendations: generateRecommendations(results, availableVars)
  });
}

function interpretResults(results) {
  const interpretations = [];
  
  // Claude
  if (results.claude.status === 'VARIABLE_MISSING') {
    interpretations.push('🚨 CLAUDE: Variable CLAUDE_API_KEY manquante dans Vercel');
  } else if (results.claude.status === 401) {
    interpretations.push('🔑 CLAUDE: Clé invalide - Régénérez sur console.anthropic.com');
  } else if (results.claude.status === 429) {
    interpretations.push('💰 CLAUDE: Quota dépassé ou rate limit');
  } else if (results.claude.status === 200) {
    interpretations.push('✅ CLAUDE: Fonctionne parfaitement !');
  } else {
    interpretations.push(`❓ CLAUDE: Statut inattendu ${results.claude.status}`);
  }
  
  // OpenAI
  if (results.openai.status === 'VARIABLE_MISSING') {
    interpretations.push('🚨 OPENAI: Variable CLE_API_OPENAI manquante dans Vercel');
  } else if (results.openai.status === 401) {
    interpretations.push('🔑 OPENAI: Clé invalide - Régénérez sur platform.openai.com');
  } else if (results.openai.status === 429) {
    interpretations.push('💰 OPENAI: Quota dépassé ou rate limit');
  } else if (results.openai.status === 200) {
    interpretations.push('✅ OPENAI: Fonctionne parfaitement !');
  } else {
    interpretations.push(`❓ OPENAI: Statut inattendu ${results.openai.status}`);
  }
  
  return interpretations;
}

function generateRecommendations(results, availableVars) {
  const recommendations = [];
  
  // Recommandations spécifiques
  if (results.claude.status === 'VARIABLE_MISSING') {
    recommendations.push({
      urgency: 'CRITICAL',
      action: 'Ajouter CLAUDE_API_KEY dans Vercel',
      steps: [
        '1. Aller sur console.anthropic.com',
        '2. Créer une nouvelle clé API',
        '3. L\'ajouter dans Vercel Settings > Environment Variables',
        '4. Nom: CLAUDE_API_KEY, Valeur: sk-ant-api03-...'
      ]
    });
  }
  
  if (results.openai.status === 'VARIABLE_MISSING') {
    recommendations.push({
      urgency: 'CRITICAL', 
      action: 'Ajouter CLE_API_OPENAI dans Vercel',
      steps: [
        '1. Aller sur platform.openai.com/api-keys',
        '2. Créer une nouvelle clé API',
        '3. L\'ajouter dans Vercel Settings > Environment Variables',
        '4. Nom: CLE_API_OPENAI, Valeur: sk-...'
      ]
    });
  }
  
  if (results.claude.status === 401) {
    recommendations.push({
      urgency: 'HIGH',
      action: 'Régénérer la clé Claude',
      reason: 'Clé Claude invalide ou expirée'
    });
  }
  
  if (results.openai.status === 401) {
    recommendations.push({
      urgency: 'HIGH', 
      action: 'Régénérer la clé OpenAI',
      reason: 'Clé OpenAI invalide ou expirée'
    });
  }
  
  if (results.claude.status === 200 && results.openai.status === 200) {
    recommendations.push({
      urgency: 'SUCCESS',
      action: '🎉 TOUT FONCTIONNE - Votre chatbot est opérationnel !',
      nextSteps: [
        'Testez votre chatbot sur julien-chatbot.vercel.app',
        'Vérifiez les CTA et la détection email',
        'Surveillez les performances'
      ]
    });
  }
  
  return recommendations;
}
