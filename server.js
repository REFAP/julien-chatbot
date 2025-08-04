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
      
      // Recherche dans plusieurs tables selon votre structure
      const searches = await Promise.all([
        this.searchInTable('FAQ', query),
        this.searchInTable('Knowledge', query),
        this.searchInTable('Products', query) // Adaptez selon vos tables
      ]);

      const allResults = searches.flat();
      const scoredResults = this.scoreResults(allResults, query);
      
      return {
        hasRelevantData: scoredResults.length > 0 && scoredResults[0].score > 0.6,
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
    const queryWords = query.toLowerCase().split(' ');
    
    // Construire la formule de recherche Airtable
    const searchFormula = this.buildSearchFormula(queryWords);
    
    try {
      const response = await fetch(`${url}?filterByFormula=${encodeURIComponent(searchFormula)}`, {
        headers: this.headers
      });

      if (!response.ok) {
        console.log(`⚠️ Table ${tableName} non trouvée ou erreur`);
        return [];
      }

      const data = await response.json();
      return data.records.map(record => ({
        ...record,
        tableName,
        relevanceScore: this.calculateRelevance(record, queryWords)
      }));
    } catch (error) {
      console.log(`⚠️ Erreur table ${tableName}:`, error.message);
      return [];
    }
  }

  buildSearchFormula(queryWords) {
    // Recherche dans les champs texte principaux
    const searchFields = ['Name', 'Question', 'Description', 'Keywords', 'Content', 'Answer', 'Response'];
    const conditions = [];

    queryWords.forEach(word => {
      const fieldConditions = searchFields.map(field => 
        `FIND("${word}", LOWER({${field}})) > 0`
      );
      conditions.push(`OR(${fieldConditions.join(', ')})`);
    });

    return `AND(${conditions.join(', ')})`;
  }

  calculateRelevance(record, queryWords) {
    let score = 0;
    const fields = record.fields;
    const searchText = Object.values(fields).join(' ').toLowerCase();

    queryWords.forEach(word => {
      const wordCount = (searchText.match(new RegExp(word, 'g')) || []).length;
      score += wordCount;
    });

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
    const queryWords = query.toLowerCase().split(' ');
    let score = result.relevanceScore || 0;

    // Bonus pour correspondance exacte dans le titre
    if (result.fields.Name && 
        result.fields.Name.toLowerCase().includes(query.toLowerCase())) {
      score += 10;
    }

    // Bonus pour correspondance dans les mots-clés
    if (result.fields.Keywords) {
      queryWords.forEach(word => {
        if (result.fields.Keywords.toLowerCase().includes(word)) {
          score += 5;
        }
      });
    }

    return Math.min(score / queryWords.length, 1); // Normaliser entre 0 et 1
  }
}

// ==================== SERVICES IA ====================

class AIService {
  static async getChatGPTResponse(message, context = '') {
    if (!OPENAI_API_KEY) return null;
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Tu es Julien, expert FAP Re-Fap. ${context ? `Contexte: ${context}` : ''}`
            },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Erreur ChatGPT:', error);
      return null;
    }
  }

  static async getClaudeResponse(message, context = '') {
    if (!CLAUDE_API_KEY) return null;
    
    try {
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
              content: `Tu es Julien, expert FAP Re-Fap. ${context ? `Contexte: ${context}` : ''}\n\nQuestion: ${message}`
            }
          ]
        })
      });

      const data = await response.json();
      return data.content[0].text;
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
    const contextData = airtableResults.results.slice(0, 3)
      .map(r => r.fields.Name || r.fields.Question || '')
      .join(', ');

    // Essayer ChatGPT en premier
    let aiResponse = await AIService.getChatGPTResponse(
      userMessage, 
      contextData ? `Données disponibles: ${contextData}` : ''
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

    // Format adaptatif selon le type de contenu
    if (fields.Answer || fields.Response) {
      response = fields.Answer || fields.Response;
    } else if (fields.Content) {
      response = fields.Content;
    } else if (fields.Description) {
      response = fields.Description;
    } else {
      response = fields.Name || "Information trouvée dans la base de données.";
    }

    return {
      response: response,
      source: 'airtable',
      confidence: match.score,
      table: match.tableName,
      recordId: match.id
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
    res.json(results);
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
    }
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
});
