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
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ipoxyhgfnzcggohugzzh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// ==================== SERVICE SUPABASE ====================

class SupabaseService {
  constructor() {
    this.baseUrl = `${SUPABASE_URL}/rest/v1`;
    this.headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  // Recherche intelligente dans Supabase
  async searchKnowledgeBase(query) {
    try {
      console.log(`🔍 Recherche Supabase pour: "${query}"`);
      
      // Recherche dans les tables disponibles
      const searches = await Promise.all([
        this.searchInTable('diagnostic', query),
        this.searchInTable('messages', query, 'robot'), // Messages du robot uniquement
        this.searchInTable('symptomes', query)
      ]);

      const allResults = searches.flat();
      const scoredResults = this.scoreResults(allResults, query);
      
      console.log(`📊 Résultats trouvés: ${scoredResults.length}, Meilleur score: ${scoredResults[0]?.score || 0}`);
      
      return {
        hasRelevantData: scoredResults.length > 0 && scoredResults[0].score > 0.3,
        results: scoredResults,
        bestMatch: scoredResults[0] || null
      };
    } catch (error) {
      console.error('❌ Erreur Supabase:', error);
      return { hasRelevantData: false, results: [], bestMatch: null };
    }
  }

  async searchInTable(tableName, query, typeFilter = null) {
    try {
      let url = `${this.baseUrl}/${tableName}?select=*`;
      
      // Filtre par type si spécifié (pour la table messages)
      if (typeFilter) {
        url += `&type_expediteur=eq.${typeFilter}`;
      }
      
      // Recherche textuelle (Supabase supporte la recherche full-text)
      const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
      
      const response = await fetch(url, {
        headers: this.headers
      });

      if (!response.ok) {
        console.log(`⚠️ Table ${tableName} non trouvée ou erreur: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      // Filtrage et scoring côté client
      return data
        .map(record => ({
          ...record,
          tableName,
          relevanceScore: this.calculateRelevance(record, queryWords, query)
        }))
        .filter(record => record.relevanceScore > 0);
        
    } catch (error) {
      console.log(`⚠️ Erreur table ${tableName}:`, error.message);
      return [];
    }
  }

  calculateRelevance(record, queryWords, originalQuery) {
    let score = 0;
    
    // Champs à analyser selon la table
    let searchableFields = [];
    
    if (record.contenu) {
      searchableFields.push('contenu');
    }
    if (record.symptomes) {
      searchableFields.push('symptomes');
    }
    if (record.diagnostic) {
      searchableFields.push('diagnostic');
    }
    if (record.causes) {
      searchableFields.push('causes');
    }
    if (record.solution) {
      searchableFields.push('solution');
    }

    // Créer le texte de recherche
    const searchText = searchableFields
      .map(field => record[field] || '')
      .join(' ')
      .toLowerCase();

    // Score basé sur les mots individuels
    queryWords.forEach(word => {
      const wordCount = (searchText.match(new RegExp(word, 'g')) || []).length;
      score += wordCount * 2;
    });

    // Bonus pour correspondance exacte
    if (searchText.includes(originalQuery.toLowerCase())) {
      score += 50;
    }

    // Bonus pour correspondance partielle (phrases de 2 mots)
    const words = originalQuery.toLowerCase().split(' ');
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = words.slice(i, i + 2).join(' ');
      if (searchText.includes(phrase)) {
        score += 25;
      }
    }

    console.log(`📋 ${record.identifiant || record.id || 'Unknown'}: "${searchText.substring(0, 50)}..." → Score: ${score}`);
    
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
    return Math.min(baseScore / 10, 1);
  }

  // Sauvegarder un message dans Supabase
  async saveMessage(message, type, response = null) {
    try {
      const messages = [];
      
      // Message utilisateur
      messages.push({
        type_expediteur: 'utilisateur',
        contenu: message
      });
      
      // Réponse du robot si fournie
      if (response) {
        messages.push({
          type_expediteur: 'robot',
          contenu: response
        });
      }
      
      const saveResponse = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(messages)
      });
      
      if (saveResponse.ok) {
        console.log('💾 Messages sauvegardés dans Supabase');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
    }
  }
}

// ==================== SERVICES IA ====================

class AIService {
  static async getChatGPTResponse(message, context = '') {
    if (!OPENAI_API_KEY) return null;
    
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
    this.supabaseService = new SupabaseService();
  }

  async processMessage(userMessage) {
    console.log(`💬 Message reçu: "${userMessage}"`);

    // 🏆 ÉTAPE 1: Recherche prioritaire dans Supabase
    const supabaseResults = await this.supabaseService.searchKnowledgeBase(userMessage);

    if (supabaseResults.hasRelevantData) {
      console.log('✅ Réponse trouvée dans Supabase');
      const formattedResponse = this.formatSupabaseResponse(supabaseResults.bestMatch);
      
      // Sauvegarder la conversation
      await this.supabaseService.saveMessage(userMessage, 'utilisateur', formattedResponse.response);
      
      return formattedResponse;
    }

    console.log('🤖 Fallback vers IA...');

    // 🥈 ÉTAPE 2: Enrichissement avec IA
    const contextData = supabaseResults.results.slice(0, 2)
      .map(r => r.contenu || r.diagnostic || r.symptomes || '')
      .join('\n');

    // Essayer ChatGPT en premier
    let aiResponse = await AIService.getChatGPTResponse(
      userMessage, 
      contextData ? `Données similaires: ${contextData}` : ''
    );

    // Fallback vers Claude si ChatGPT échoue
    if (!aiResponse) {
      console.log('🎭 Fallback vers Claude...');
      aiResponse = await AIService.getClaudeResponse(userMessage, contextData);
    }

    const finalResponse = aiResponse || "Désolé, je ne peux pas répondre à cette question pour le moment.";
    
    // Sauvegarder la conversation
    await this.supabaseService.saveMessage(userMessage, 'utilisateur', finalResponse);

    return {
      response: finalResponse,
      source: aiResponse ? 'AI' : 'fallback',
      supabaseContext: supabaseResults.results.length > 0 ? 'partial' : 'none'
    };
  }

  formatSupabaseResponse(match) {
    let response = '';
    
    // Format adaptatif selon le contenu disponible
    if (match.contenu) {
      response = match.contenu;
    } else if (match.diagnostic) {
      response = `🔧 **Diagnostic**: ${match.diagnostic}`;
      
      if (match.symptomes) {
        response = `🔧 **Symptômes**: ${match.symptomes}\n\n${response}`;
      }
      
      if (match.causes) {
        response += `\n\n🔍 **Causes probables**: ${match.causes}`;
      }
      
      if (match.solution) {
        response += `\n\n✅ **Solution**: ${match.solution}`;
      }
    } else {
      response = "Information trouvée dans la base de données.";
    }

    return {
      response: response,
      source: 'supabase',
      confidence: match.score,
      table: match.tableName,
      recordId: match.identifiant || match.id
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

// Route de test Supabase
app.get('/api/test-supabase/:query', async (req, res) => {
  try {
    const results = await chatbot.supabaseService.searchKnowledgeBase(req.params.query);
    res.json({
      query: req.params.query,
      ...results,
      debug: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour voir les messages récents
app.get('/api/messages', async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/messages?select=*&order=cree_a.desc&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const messages = await response.json();
    res.json(messages);
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
      supabase: SUPABASE_KEY ? 'Configuré' : 'Manquant',
      openai: OPENAI_API_KEY ? 'Configuré' : 'Manquant',
      claude: CLAUDE_API_KEY ? 'Configuré' : 'Manquant'
    },
    supabase_url: SUPABASE_URL,
    version: 'Avec Supabase'
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
  console.log(`🔍 Test Supabase: http://localhost:${port}/api/test-supabase/voyant%20moteur`);
});
