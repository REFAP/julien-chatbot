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

// ==================== BASE DE DONNÉES EXPERTE ====================

const expertDatabase = [
  {
    id: 'CAS001',
    symptomes: 'Voyant moteur allumé, perte de puissance',
    codes_erreur: 'P2002',
    causes_probables: 'FAP colmaté, conduite urbaine exclusive, injecteurs encrassés',
    diagnostic_conseille: 'Lecture OBD + vérification pression différentielle FAP',
    solution_proposee: 'Nettoyage FAP Re-Fap recommandé, suivi d\'un cycle de régénération',
    conseils_utiles: 'Faire un décrassage sur autoroute, utiliser un AdBlue certifié',
    erreurs_a_eviter: 'Ne pas forcer la régénération sans diagnostic',
    keywords: 'voyant moteur perte puissance fap p2002 colmate'
  },
  {
    id: 'CAS002',
    symptomes: 'Voyant préchauffage qui clignote',
    codes_erreur: 'P0401',
    causes_probables: 'Vanne EGR encrassée, défaillance capteur de position',
    diagnostic_conseille: 'Contrôle vanne EGR + débitmètre d\'air',
    solution_proposee: 'Nettoyage ou remplacement vanne EGR',
    conseils_utiles: 'Éviter la conduite exclusivement urbaine',
    erreurs_a_eviter: 'Ne pas rouler longtemps avec ce symptôme',
    keywords: 'voyant prechauffage clignote egr p0401 vanne'
  },
  {
    id: 'CAS003',
    symptomes: 'Fumée noire à l\'accélération',
    codes_erreur: 'P2463',
    causes_probables: 'Filtre à air sale, injecteurs encrassés, turbo défaillant',
    diagnostic_conseille: 'Inspection visuelle, contrôle pression carburant',
    solution_proposee: 'Nettoyage injecteurs + remplacement filtre à air',
    conseils_utiles: 'Remplacer régulièrement les filtres',
    erreurs_a_eviter: 'Ne pas ignorer les symptômes',
    keywords: 'fumee noire acceleration injecteurs filtre air p2463'
  },
  {
    id: 'CAS004',
    symptomes: 'Voyant AdBlue avec décompte kilométrage',
    codes_erreur: 'P20EE',
    causes_probables: 'Qualité d\'AdBlue douteuse, réservoir mal rempli ou capteur défectueux',
    diagnostic_conseille: 'Lecture OBD + inspection visuelle du réservoir AdBlue',
    solution_proposee: 'Vidange AdBlue + remplissage avec AdBlue certifié',
    conseils_utiles: 'Utiliser un AdBlue certifié, ne jamais remplir avec un AdBlue douteux',
    erreurs_a_eviter: 'Ne pas rouler longtemps avec ce voyant',
    keywords: 'voyant adblue decompte kilometrage p20ee qualite reservoir'
  },
  {
    id: 'CAS005',
    symptomes: 'Démarrage interdit dans 10 km',
    codes_erreur: 'P229F',
    causes_probables: 'Réservoir mal rempli ou carburant de mauvaise qualité',
    diagnostic_conseille: 'Contrôle qualité carburant + système d\'injection',
    solution_proposee: 'Vidange + remplacement par carburant de qualité',
    conseils_utiles: 'Éviter les stations-service douteuses',
    erreurs_a_eviter: 'Ne pas rouler avec du carburant de mauvaise qualité',
    keywords: 'demarrage interdit 10km p229f carburant qualite reservoir'
  },
  {
    id: 'CAS006',
    symptomes: 'Turbo qui siffle fort',
    codes_erreur: 'P0171',
    causes_probables: 'Turbine en début de jeu, durites percées',
    diagnostic_conseille: 'Contrôle visuel + test pression turbo',
    solution_proposee: 'Remplacement turbo si jeu excessif',
    conseils_utiles: 'Vérifier régulièrement les durites',
    erreurs_a_eviter: 'Ne pas forcer le moteur avec un turbo défaillant',
    keywords: 'turbo siffle fort p0171 turbine jeu durites'
  },
  {
    id: 'CAS007',
    symptomes: 'Perte de puissance en charge',
    codes_erreur: 'P0670',
    causes_probables: 'Bougies ou boîtier de préchauffage défectueux',
    diagnostic_conseille: 'Test résistance bougies + contrôle boîtier',
    solution_proposee: 'Remplacement bougies de préchauffage',
    conseils_utiles: 'Remplacer toutes les bougies en même temps',
    erreurs_a_eviter: 'Ne pas rouler longtemps avec des bougies HS',
    keywords: 'perte puissance charge p0670 bougies prechauffage boitier'
  }
];

// ==================== SERVICE DE RECHERCHE EXPERT ====================

class ExpertSearchService {
  static searchInDatabase(query) {
    console.log(`🔍 Recherche experte pour: "${query}"`);
    
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    
    const results = expertDatabase.map(item => {
      let score = 0;
      
      // Recherche dans tous les champs
      const searchFields = [
        item.symptomes,
        item.codes_erreur,
        item.causes_probables,
        item.diagnostic_conseille,
        item.solution_proposee,
        item.keywords
      ].join(' ').toLowerCase();
      
      // Score par mot
      queryWords.forEach(word => {
        const count = (searchFields.match(new RegExp(word, 'g')) || []).length;
        score += count * 2;
      });
      
      // Bonus pour correspondance exacte dans symptômes
      if (item.symptomes.toLowerCase().includes(queryLower)) {
        score += 50;
      }
      
      // Bonus pour correspondance dans codes erreur
      if (item.codes_erreur && queryLower.includes(item.codes_erreur.toLowerCase())) {
        score += 30;
      }
      
      // Bonus pour mots-clés
      queryWords.forEach(word => {
        if (item.keywords.includes(word)) {
          score += 10;
        }
      });
      
      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

    console.log(`📊 ${results.length} résultats trouvés, meilleur score: ${results[0]?.score || 0}`);
    
    return {
      hasRelevantData: results.length > 0 && results[0].score > 5,
      results: results,
      bestMatch: results[0] || null
    };
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
      confidence: Math.min(match.score / 20, 1),
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

Réponds de manière claire et professionnelle comme un vrai expert automobile.`;

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

    // 🏆 ÉTAPE 1: Recherche dans la base experte
    const searchResults = ExpertSearchService.searchInDatabase(userMessage);

    if (searchResults.hasRelevantData) {
      console.log('✅ Réponse trouvée dans la base experte');
      return ExpertSearchService.formatResponse(searchResults.bestMatch);
    }

    console.log('🤖 Fallback vers IA...');

    // 🥈 ÉTAPE 2: Utiliser l'IA avec contexte
    const contextData = searchResults.results.slice(0, 2)
      .map(r => `${r.id}: ${r.symptomes}`)
      .join('\n');

    // Essayer ChatGPT en premier
    let aiResponse = await AIService.getChatGPTResponse(
      userMessage, 
      contextData ? `Données similaires trouvées:\n${contextData}` : ''
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

// Route de test de la base experte
app.get('/api/test-database/:query', async (req, res) => {
  try {
    const results = ExpertSearchService.searchInDatabase(req.params.query);
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
      database: 'Expert FAP Re-Fap (7 cas)',
      openai: OPENAI_API_KEY ? 'Configuré' : 'Manquant',
      claude: CLAUDE_API_KEY ? 'Configuré' : 'Manquant'
    },
    version: 'Expert Stable'
  });
});

// Servir le fichier HTML principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Serveur expert démarré sur le port ${port}`);
  console.log(`📊 Dashboard: http://localhost:${port}`);
  console.log(`🔧 Test API: http://localhost:${port}/api/health`);
  console.log(`🔍 Test base: http://localhost:${port}/api/test-database/voyant%20moteur`);
});
