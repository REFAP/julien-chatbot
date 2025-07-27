// api/debug-keys.js - Version corrigée pour Claude API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    console.log('🔍 Démarrage du diagnostic API...');

    // Variables d'environnement
    const claudeKey = process.env.CLAUDE_API_KEY;
    const openaiKey = process.env.CLE_API_OPENAI;
    const resendKey = process.env.RESEND_API_KEY;

    console.log('Variables:', {
      claude: claudeKey ? 'Présente' : 'Manquante',
      openai: openaiKey ? 'Présente' : 'Manquante',
      resend: resendKey ? 'Présente' : 'Manquante'
    });

    const results = {};

    // Test Claude API avec la bonne URL et méthode
    try {
      console.log('🧪 Test Claude API...');
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Test'
            }
          ]
        })
      });

      results.claude = {
        status: claudeResponse.status,
        statusText: claudeResponse.statusText,
        ok: claudeResponse.ok
      };

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        results.claude.error = errorText;
        console.log('❌ Claude error:', errorText);
      } else {
        console.log('✅ Claude OK');
      }
    } catch (error) {
      console.error('💥 Claude error:', error);
      results.claude = {
        status: 'ERROR',
        error: error.message
      };
    }

    // Test OpenAI API
    try {
      console.log('🧪 Test OpenAI API...');
      const openaiResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        }
      });

      results.openai = {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        ok: openaiResponse.ok
      };

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        results.openai.error = errorText;
        console.log('❌ OpenAI error:', errorText);
      } else {
        console.log('✅ OpenAI OK');
      }
    } catch (error) {
      console.error('💥 OpenAI error:', error);
      results.openai = {
        status: 'ERROR',
        error: error.message
      };
    }

    // Recommandations
    const recommendations = [];
    
    if (results.claude.status !== 200) {
      if (!claudeKey) {
        recommendations.push('❌ Clé Claude manquante');
      } else if (results.claude.status === 401) {
        recommendations.push('❌ Clé Claude invalide - Vérifiez sur console.anthropic.com');
      } else if (results.claude.status === 404) {
        recommendations.push('❌ URL Claude incorrecte - Corrigée dans ce fichier');
      } else {
        recommendations.push(`❌ Erreur Claude ${results.claude.status}: ${results.claude.error}`);
      }
    } else {
      recommendations.push('✅ Claude API fonctionnelle');
    }

    if (results.openai.status !== 200) {
      if (!openaiKey) {
        recommendations.push('❌ Clé OpenAI manquante');
      } else {
        recommendations.push('❌ Clé OpenAI invalide');
      }
    } else {
      recommendations.push('✅ OpenAI API fonctionnelle');
    }

    // Score de santé
    const healthScore = ((results.claude.status === 200 ? 50 : 0) + 
                       (results.openai.status === 200 ? 50 : 0));

    const response = {
      timestamp: new Date().toISOString(),
      healthScore: `${healthScore}%`,
      keyPresence: {
        claude: !!claudeKey,
        openai: !!openaiKey,
        resend: !!resendKey
      },
      results,
      recommendations,
      interpretation: healthScore === 100 ? 
        ['🎉', 'TOUTES LES APIS FONCTIONNENT !'] : 
        ['❌', 'Problèmes détectés:', `Utilisez les recommandations ci-dessous`]
    };

    console.log('📊 Diagnostic terminé:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('💥 Erreur diagnostic:', error);
    res.status(500).json({ 
      error: 'Erreur lors du diagnostic', 
      details: error.message 
    });
  }
}
