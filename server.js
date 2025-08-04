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

// Configuration des APIs
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// ==================== SERVICES AIRTABLE ====================

class AirtableService {
  constructor() {
    this.baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
    this.headers = {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  // Recherche prioritaire dans Airtable avec scoring
  async searchKnowledgeBase(query) {
    try {
      console.log(`🔍 Recherche Airtable pour: "${query}"`);
      
      // Recherche dans vos tables spécifiques
     const searches = await Promise.all([
  this.searchInTable('tbl8Dwqc1BNZSgQnU', query), // Votre table principale
]);
  this.searchInTable('DIAGNOSTICS', query),
  this.searchInTable('LEADS', query),
  this.searchInTable('KNOWLEDGE_BASE', query),
  this.searchInTable('VEHICULES_SENSIBLES', query)
]);

      const allResults = searches.flat();
      const scoredResults = this.scoreResults(allResults, query);
      
      console.log(`📊 Résultats trouvés: ${scoredResults.length}, Meilleur score: ${scoredResults[0]?.score || 0}`);
      
      return {
        hasRelevantData: scoredResults.length > 0 && scoredResults[0].score > 0.1, // Seuil abaissé
        results: scoredResults,
        bestMatch: scoredResults[0] || null
      };
    } catch (error) {
      console.error('❌ Erreur Airtable:', error);
      return { hasRelevantData: false, results: [], bestMatch: null };
    }
  }

  async searchInTable(tableName, query) {
    const url = `${this.baseUrl}/${tableName}`;
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2); // Ignorer mots trop courts
    
    try {
      // Recherche simple sans filtres complexes pour éviter les erreurs
      const response = await fetch(url, {
        headers: this.headers
      });

      if (!response.ok) {
        console.log(`⚠️ Table ${tableName} non trouvée ou erreur: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      // Filtrage et scoring côté serveur
      return data.records
        .map(record => ({
          ...record,
          tableName,
          relevanceScore: this.calculateRelevance(record, queryWords, query)
        }))
        .filter(record => record.relevanceScore > 0); // Garder seulement les pertinents
        
    } catch (error) {
      console.log(`⚠️ Erreur table ${tableName}:`, error.message);
      return [];
    }
  }

  calculateRelevance(record, queryWords, originalQuery) {
    let score = 0;
    const fields = record.fields;
    
    // Tous les champs de votre Airtable à analyser
    const searchableFields = [
      'ID_Cas', 'Symptomes', 'Codes_Erreur', 'Causes_probables', 
      'Diagnostic_conseille', 'Solution_Proposee', 'Conseils_utiles',
      'Erreurs_a_eviter', 'Ton_de_reponse'
    ];

    // Créer le texte de recherche
    const searchText = searchableFields
      .map(field => fields[field] || '')
      .join(' ')
      .toLowerCase();

    // Score basé sur les mots individuels
    queryWords.forEach(word => {
      const wordCount = (searchText.match(new RegExp(word, 'g')) || []).length;
      score += wordCount * 2; // Bonus pour chaque occurrence
    });

    // Bonus énorme pour correspondance exacte ou partielle dans les symptômes
    if (fields.Symptomes) {
      const symptoms = fields.Symptomes.toLowerCase();
      
      // Correspondance exacte de la requête complète
      if (symptoms.includes(originalQuery.toLowerCase())) {
        score += 50;
      }
      
      // Correspondance partielle forte (plusieurs mots consécutifs)
      const queryPhrase = originalQuery.toLowerCase();
      const words = queryPhrase.split(' ');
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = words.slice(i, i + 2).join(' ');
        if (symptoms.includes(phrase)) {
          score += 25;
        }
      }
    }

    // Bonus pour correspondance dans les codes d'erreur
    if (fields.Codes_Erreur) {
      queryWords.forEach(word => {
        if (fields.Codes_Erreur.toLowerCase().includes(word)) {
          score += 15;
        }
      });
    }

    // Bonus pour ID_Cas correspondant
    if (fields.ID_Cas && originalQuery.toLowerCase().includes(fields.ID_Cas.toLowerCase())) {
      score += 30;
    }

    console.log(`📋 ${fields.ID_Cas || 'Unknown'}: "${fields.Symptomes?.substring(0, 50)}..." → Score: ${score}`);
    
    return score;
  }

  scoreResults(results, originalQuery) {
    return results
      .map(result => ({
        ...result,
        score: this.calculateFinalScore(result, originalQuery)
      }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  calculateFinalScore(result, query) {
    const baseScore = result.relevanceScore || 0;
    
    // Normaliser le score (plus flexible)
    return Math.min(baseScore / 10, 1); // Divisé par 10 au lieu de query length
  }
}

// ==================== SERVICES IA ====================

class AIService {
  static async getChatGPTResponse(message, context = '') {
    if (!OPENAI_API_KEY) return null;
    
    try {
      const systemPrompt = `Tu es Julien, expert FAP Re-Fap. Tu aides avec les problèmes de moteur et diagnostic automobile.
${context ? `Contexte de la base de données (ne pas reproduire exactement): ${context}` : ''}

Réponds de manière claire et professionnelle. Si tu as un contexte de la base de données, inspire-toi en mais reformule avec tes propres mots.`;

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

      const data = await response.json();
      return data.choices?.[0]?.message?.content;
    } catch (error) {
      console.error('❌ Erreur ChatGPT:', error);
      return null;
    }
  }

  static async getClaudeResponse(message, context = '') {
    if (!CLAUDE_API_KEY) return null;
    
    try {
      const systemPrompt = `Tu es Julien, expert FAP Re-Fap. Tu aides avec les problèmes de moteur et diagnostic automobile.
${context ? `Contexte de la base de données: ${context}` : ''}`;

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
  constructor() {
    this.airtableService = new AirtableService();
  }

  async processMessage(userMessage) {
    console.log(`💬 Message reçu: "${userMessage}"`);

    // 🏆 ÉTAPE 1: Recherche prioritaire dans Airtable
    const airtableResults = await this.airtableService.searchKnowledgeBase(userMessage);

    if (airtableResults.hasRelevantData) {
      console.log('✅ Réponse trouvée dans Airtable');
      return this.formatAirtableResponse(airtableResults.bestMatch);
    }

    console.log('🤖 Fallback vers IA...');

    // 🥈 ÉTAPE 2: Enrichissement avec IA si nécessaire
    const contextData = airtableResults.results.slice(0, 2)
      .map(r => `${r.fields.ID_Cas}: ${r.fields.Symptomes} -> ${r.fields.Causes_probables}`)
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
      airtableContext: airtableResults.results.length > 0 ? 'partial' : 'none'
    };
  }

  formatAirtableResponse(match) {
    const fields = match.fields;
    let response = '';

    // Format adapté à votre structure Airtable
    const casId = fields.ID_Cas || '';
    const symptoms = fields.Symptomes || '';
    const errorCodes = fields.Codes_Erreur || '';
    const probableCauses = fields.Causes_probables || '';
    const diagnosis = fields.Diagnostic_conseille || '';
    const solution = fields.Solution_Proposee || '';
    const tips = fields.Conseils_utiles || '';
    const avoidErrors = fields.Erreurs_a_eviter || '';

    // Construction de la réponse experte
    response = `🔧 **${casId}** - ${symptoms}`;
    
    if (errorCodes) {
      response += `\n\n📟 **Code d'erreur**: ${errorCodes}`;
    }
    
    if (probableCauses) {
      response += `\n\n🔍 **Causes probables**: ${probableCauses}`;
    }
    
    if (diagnosis) {
      response += `\n\n🎯 **Diagnostic conseillé**: ${diagnosis}`;
    }
    
    if (solution) {
      response += `\n\n✅ **Solution proposée**: ${solution}`;
    }
    
    if (tips) {
      response += `\n\n💡 **Conseils utiles**: ${tips}`;
    }
    
    if (avoidErrors) {
      response += `\n\n⚠️ **Erreurs à éviter**: ${avoidErrors}`;
    }

    return {
      response: response,
      source: 'airtable',
      confidence: match.score,
      table: match.tableName,
      recordId: match.id,
      casId: casId
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
      error: 'Erreur interne du serveur',
      success: false
    });
  }
});

// Route de test Airtable
app.get('/api/test-airtable/:query', async (req, res) => {
  try {
    const results = await chatbot.airtableService.searchKnowledgeBase(req.params.query);
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
      airtable: !!AIRTABLE_API_KEY,
      openai: !!OPENAI_API_KEY,
      claude: !!CLAUDE_API_KEY
    },
    airtable_base: AIRTABLE_BASE_ID ? 'Configuré' : 'Manquant'
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
  console.log(`🔍 Test Airtable: http://localhost:${port}/api/test-airtable/voyant%20moteur`);
});
