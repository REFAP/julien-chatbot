const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configuration des APIs (seulement IA)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// ==================== BASE DE DONNÉES FICTIVE ====================

const fakeDatabase = [
  {
    id: 'CAS001',
    symptomes: 'Voyant moteur allumé, perte de puissance',
    codes_erreur: 'P2002',
    causes_probables: 'FAP colmaté, conduite urbaine exclusive, injecteurs encrassés',
    diagnostic_conseille: 'Lecture OBD + vérification pression différentielle FAP',
    solution_proposee: 'Nettoyage FAP Re-Fap recommandé, suivi d\'un cycle de régénération',
    conseils_utiles: 'Faire un décrassage sur autoroute, utiliser un AdBlue certifié',
    erreurs_a_eviter: 'Ne pas forcer la régénération sans diagnostic'
  },
  {
    id: 'CAS002',
    symptomes: 'Voyant préchauffage qui clignote',
    codes_erreur: 'P0401',
    causes_probables: 'Vanne EGR encrassée, défaillance capteur de position',
    diagnostic_conseille: 'Contrôle vanne EGR + débitmètre',
    solution_proposee: 'Nettoyage ou remplacement vanne EGR',
    conseils_utiles: 'Éviter la conduite exclusivement urbaine',
    erreurs_a_eviter: 'Ne pas rouler longtemps avec ce symptôme'
  },
  {
    id: 'CAS003',
    symptomes: 'Fumée noire à l\'accélération',
    codes_erreur: 'P2463',
    causes_probables: 'Filtre à air sale, injecteurs encrassés',
    diagnostic_conseille: 'Inspection visuelle, contrôle pression carburant',
    solution_proposee: 'Nettoyage injecteurs + filtre',
    conseils_utiles: 'Remplacer régulièrement les filtres',
    erreurs_a_eviter: 'Ne pas ignorer les symptômes'
  }
];

// ==================== SERVICE DE RECHERCHE FICTIVE ====================

class MockSearchService {
  static searchInDatabase(query) {
    console.log(`🔍 Recherche dans la base fictive pour: "${query}"`);
    
    const results = fakeDatabase.filter(item => {
      const searchText = `${item.symptomes} ${item.codes_erreur} ${item.causes_probables}`.toLowerCase();
      const queryWords = query.toLowerCase().split(' ');
      
      return queryWords.some(word => searchText.includes(word));
    });

    // Calculer un score simple
    const scoredResults = results.map(result => ({
      ...result,
      score: this.calculateScore(result, query)
    })).sort((a, b) => b.score - a.score);

    console.log(`📊 ${scoredResults.length} résultats trouvés`);
    
    return {
      hasRelevantData: scoredResults.length > 0 && scoredResults[0].score > 0.3,
      results: scoredResults,
      bestMatch: scoredResults[0] || null
    };
  }

  static calculateScore(item, query) {
    const searchText = `${item.symptomes} ${item.codes_erreur}`.toLowerCase();
    const queryWords = query.toLowerCase().split(' ');
    
    let score = 0;
    queryWords.forEach(word => {
      if (searchText.includes(word)) {
        score += 1;
      }
    });
    
    // Bonus pour correspondance dans les symptômes
    if (item.symptomes.toLowerCase().includes(query.toLowerCase())) {
      score += 5;
    }
    
    return score / queryWords.length;
  }

  static formatResponse(match) {
    let response = `🔧 **${match.id}** - ${match.symptomes}`;
    
    if (match.codes_erreur) {
      response += `\n\n📟 **Code d'erreur**: ${match.codes_erreur}`;
    }
    
    if (match.causes_probables) {
      response += `\n\n🔍 **Causes probables**: ${match.causes_probables}`;
    }
    
    if (match.diagnostic_conseille) {
      response += `\n\n🎯 **Diagnostic conseillé**: ${match.diagnostic_conseille}`;
    }
    
    if (match.solution_proposee) {
      response += `\n\n✅ **Solution proposée**: ${match.solution_proposee}`;
    }
    
    if (match.conseils_utiles) {
      response += `\n\n💡 **Conseils utiles**: ${match.conseils_utiles}`;
    }
    
    if (match.erreurs_a_eviter) {
      response += `\n\n⚠️ **Erreurs à éviter**: ${match.erreurs_a_eviter}`;
    }

    return {
      response: response,
      source: 'database',
      confidence: match.score,
      casId: match.id
    };
  }
}

// ==================== SERVICES IA ====================

class AIService {
  static async getChatGPTResponse(message, context = '') {
    if (!OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key manquante');
      return null;
    }
    
    try {
      const systemPrompt = `Tu es Julien, expert FAP Re-Fap. Tu aides avec les problèmes de moteur et diagnostic automobile.
${context ? `Contexte de la base de données: ${context}` : ''}

Réponds de manière claire et professionnelle.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content;
    } catch (error) {
      console.error('❌ Erreur ChatGPT:', error);
      return null;
    }
  }

  static async getClaudeResponse(message, context = '') {
    if (!CLAUDE_API_KEY) {
      console.log('⚠️ Claude API key manquante');
      return null;
    }
    
    try {
      const systemPrompt = `Tu es Julien, expert FAP Re-Fap. Tu aides avec les problèmes de moteur et diagnostic automobile.
${context ? `Contexte: ${context}` : ''}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\nQuestion: ${message}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.content?.[0]?.text;
    } catch (error) {
      console.error('❌ Erreur Claude:', error);
      return null;
    }
  }
}

// ==================== LOGIQUE PRINCIPALE ====================

class ChatbotController {
  async processMessage(userMessage) {
    console.log(`💬 Message reçu: "${userMessage}"`);

    // 🏆 ÉTAPE 1: Recherche dans la base fictive
    const searchResults = MockSearchService.searchInDatabase(userMessage);

    if (searchResults.hasRelevantData) {
      console.log('✅ Réponse trouvée dans la base de données');
      return MockSearchService.formatResponse(searchResults.bestMatch);
    }

    console.log('🤖 Fallback vers IA...');

    // 🥈 ÉTAPE 2: Utiliser l'IA
    const contextData = searchResults.results.slice(0, 2)
      .map(r => `${r.id}: ${r.symptomes}`)
      .join('\n');

    // Essayer ChatGPT en premier
    let aiResponse = await AIService.getChatGPTResponse(
      userMessage, 
      contextData ? `Données similaires:\n${contextData}` : ''
    );

    // Fallback vers Claude si ChatGPT échoue
    if (!aiResponse) {
      console.log('🎭 Fallback vers Claude...');
      aiResponse = await AIService.getClaudeResponse(userMessage, contextData);
    }

    return {
      response: aiResponse || "Désolé, je ne peux pas répondre à cette question pour le moment.",
      source: aiResponse ? 'AI' : 'fallback',
      context: searchResults.results.length > 0 ? 'partial' : 'none'
    };
  }
}

// ==================== ROUTES ====================

const chatbot = new ChatbotController();

// Route principale du chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    const result = await chatbot.processMessage(message);
    
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur: ' + error.message,
      success: false
    });
  }
});

// Route de test de la base fictive
app.get('/api/test-database/:query', async (req, res) => {
  try {
    const results = MockSearchService.searchInDatabase(req.params.query);
    res.json({
      query: req.params.query,
      ...results,
      debug: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'Fictive (OK)',
      openai: OPENAI_API_KEY ? 'Configuré' : 'Manquant',
      claude: CLAUDE_API_KEY ? 'Configuré' : 'Manquant'
    },
    version: 'Sans Airtable'
  });
});

// Servir le fichier HTML principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur le port ${port}`);
  console.log(`📊 Dashboard: http://localhost:${port}`);
  console.log(`🔧 Test API: http://localhost:${port}/api/health`);
  console.log(`🔍 Test base: http://localhost:${port}/api/test-database/voyant%20moteur`);
});
