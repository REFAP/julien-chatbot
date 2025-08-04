const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ==================== MIDDLEWARE DE BASE ====================
app.use(cors({
  origin: ['http://localhost:3000', 'https://julien-chatbot.vercel.app', 'https://your-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('.'));

// Gestion preflight CORS
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Configuration APIs
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// ==================== CHARGEMENT BASE DE CONNAISSANCES ====================
let KNOWLEDGE_BASE;

function loadKnowledgeBase() {
  try {
    const kbPath = path.join(__dirname, 'knowledge-base.json');
    if (fs.existsSync(kbPath)) {
      KNOWLEDGE_BASE = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
      console.log(`📚 Base de connaissances v${KNOWLEDGE_BASE.version} chargée`);
      console.log(`📊 ${Object.keys(KNOWLEDGE_BASE.signals).length} signaux, ${Object.keys(KNOWLEDGE_BASE.causes).length} causes, ${Object.keys(KNOWLEDGE_BASE.workflows).length} workflows`);
    } else {
      console.warn('⚠️  knowledge-base.json manquant, utilisation base réduite');
      KNOWLEDGE_BASE = createFallbackKnowledgeBase();
    }
  } catch (error) {
    console.error('❌ Erreur chargement base de connaissances:', error);
    KNOWLEDGE_BASE = createFallbackKnowledgeBase();
  }
}

function createFallbackKnowledgeBase() {
  return {
    version: "1.0.0-fallback",
    signals: {
      dashboard_lights: {
        id: "dashboard_lights",
        type: "multiple_choice",
        question: "Quels voyants sont allumés ?",
        options: [
          {"id": "dpf_light", "label": "🟡 Voyant FAP", "weight": 5},
          {"id": "engine_light", "label": "🔶 Voyant moteur", "weight": 3}
        ]
      }
    },
    causes: {
      dpf_clogged: {
        id: "dpf_clogged",
        name: "FAP colmaté",
        probability_base: 0.8,
        signal_weights: {
          dashboard_lights: {"dpf_light": 5, "engine_light": 3}
        },
        technical_explanation: "Filtre à particules saturé",
        severity: "moderate"
      }
    },
    workflows: {
      highway_regeneration: {
        id: "highway_regeneration",
        name: "Régénération autoroute",
        category: "self_service",
        success_probability: 0.65,
        steps: [{"step": 1, "title": "Trajet autoroute 30+ km"}]
      }
    },
    response_templates: {
      diagnosis_confidence_high: {
        template: "🎯 **Diagnostic : {cause_name}**\n\n{technical_explanation}",
        tone: "confident"
      }
    }
  };
}

// ==================== MOTEUR DE DIAGNOSTIC INTELLIGENT ====================
class FAPDiagnosticEngine {
  constructor(knowledgeBase) {
    this.kb = knowledgeBase;
    this.sessions = new Map();
    this.learningData = new Map();
  }

  // Session Management
  createSession(sessionId) {
    const session = {
      id: sessionId,
      created_at: new Date(),
      state: 'initial',
      collected_signals: {},
      conversation_history: [],
      current_scores: {},
      attempted_workflows: [],
      current_progress: 0
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || this.createSession(sessionId);
  }

  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    Object.assign(session, updates);
    session.updated_at = new Date();
    this.sessions.set(sessionId, session);
    return session;
  }

  // Scoring probabiliste
  calculateProbabilityScores(collectedSignals) {
    const scores = {};
    
    // Initialiser avec probabilités de base
    Object.keys(this.kb.causes).forEach(causeId => {
      scores[causeId] = this.kb.causes[causeId].probability_base || 0.5;
    });

    // Appliquer les poids des signaux
    Object.entries(collectedSignals).forEach(([signalId, signalValue]) => {
      Object.entries(this.kb.causes).forEach(([causeId, cause]) => {
        if (cause.signal_weights && cause.signal_weights[signalId]) {
          const signalWeights = cause.signal_weights[signalId];
          
          if (typeof signalValue === 'string' && signalWeights[signalValue]) {
            scores[causeId] += signalWeights[signalValue] * 0.05;
          } else if (Array.isArray(signalValue)) {
            signalValue.forEach(option => {
              if (signalWeights[option]) {
                scores[causeId] += signalWeights[option] * 0.05;
              }
            });
          }
        }
      });
    });

    // Normaliser (0-1)
    Object.keys(scores).forEach(causeId => {
      scores[causeId] = Math.min(Math.max(scores[causeId], 0), 1);
    });

    return scores;
  }

  // Extraction de signaux depuis message initial
  extractSignalsFromMessage(message) {
    const signals = {};
    const messageLower = message.toLowerCase();

    // Codes d'erreur
    if (this.kb.signals.error_codes && this.kb.signals.error_codes.patterns) {
      const detectedCodes = [];
      this.kb.signals.error_codes.patterns.forEach(pattern => {
        if (messageLower.includes(pattern.pattern.toLowerCase())) {
          detectedCodes.push({
            code: pattern.pattern,
            weight: pattern.weight,
            urgent: pattern.urgent
          });
        }
      });
      
      if (detectedCodes.length > 0) {
        signals.error_codes = detectedCodes;
      }
    }

    // Mots-clés symptômes
    const keywordMapping = {
      dashboard_lights: ['voyant', 'témoin', 'allumé', 'clignote', 'fap', 'moteur'],
      power_loss: ['puissance', 'perte', 'mou', 'accélération', 'force'],
      exhaust_smoke: ['fumée', 'fume', 'noir', 'blanc', 'bleu'],
      driving_pattern: ['ville', 'urbain', 'autoroute', 'court', 'long', 'trajet']
    };

    Object.entries(keywordMapping).forEach(([signalId, keywords]) => {
      const matchCount = keywords.filter(keyword => messageLower.includes(keyword)).length;
      if (matchCount > 0) {
        signals[signalId] = {
          type: 'keyword_detected',
          confidence: Math.min(matchCount * 0.3, 1),
          matched_keywords: keywords.filter(keyword => messageLower.includes(keyword))
        };
      }
    });

    return signals;
  }

  // Questions intelligentes
  getNextBestQuestion(session) {
    const { collected_signals } = session;
    
    // Signaux non collectés, triés par priorité
    const availableSignals = Object.values(this.kb.signals)
      .filter(signal => !collected_signals[signal.id])
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));

    return availableSignals[0] || null;
  }

  // Sélection de workflow
  selectBestWorkflow(session, topCauses) {
    const applicableWorkflows = Object.values(this.kb.workflows).filter(workflow => {
      return this.isWorkflowApplicable(workflow, session, topCauses);
    });

    if (applicableWorkflows.length === 0) return null;

    // Trier par efficacité
    return applicableWorkflows.sort((a, b) => {
      const scoreA = (a.success_probability || 0.5) / ((a.cost_level || 1) + (a.invasiveness || 1));
      const scoreB = (b.success_probability || 0.5) / ((b.cost_level || 1) + (b.invasiveness || 1));
      return scoreB - scoreA;
    })[0];
  }

  isWorkflowApplicable(workflow, session, topCauses) {
    const { conditions } = workflow;
    if (!conditions) return true;

    // Vérifier causes requises
    if (conditions.required) {
      const hasRequired = conditions.required.some(causeId => 
        topCauses.find(cause => cause.id === causeId)
      );
      if (!hasRequired) return false;
    }

    // Vérifier exclusions
    if (conditions.excluded) {
      const hasExcluded = conditions.excluded.some(causeId =>
        topCauses.find(cause => cause.id === causeId)
      );
      if (hasExcluded) return false;
    }

    return true;
  }

  // Génération de réponse
  generateResponse(session, context = {}) {
    const { current_scores, collected_signals } = session;
    const topCauses = this.getTopCauses(current_scores, 3);
    const confidence = topCauses[0]?.score || 0;

    // Calculer progression
    const totalSignals = Object.keys(this.kb.signals).length;
    const collectedCount = Object.keys(collected_signals).length;
    const progress = Math.round((collectedCount / totalSignals) * 100);

    // Sélectionner template
    let templateKey = 'gathering_information';
    if (confidence > 0.8) {
      templateKey = 'diagnosis_confidence_high';
    } else if (confidence > 0.5) {
      templateKey = 'diagnosis_confidence_medium';
    }

    const template = this.kb.response_templates[templateKey];
    
    // Construire réponse
    return this.buildResponse(template, {
      confidence: Math.round(confidence * 100),
      topCauses,
      session,
      progress,
      context
    });
  }

  getTopCauses(scores, limit = 3) {
    return Object.entries(scores)
      .map(([causeId, score]) => ({
        id: causeId,
        score: score,
        ...this.kb.causes[causeId]
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  buildResponse(template, data) {
    let response = template.template;
    
    // Remplacements basiques
    response = response.replace(/\{confidence\}/g, data.confidence);
    response = response.replace(/\{progress\}/g, data.progress);
    response = response.replace(/\{cause_name\}/g, data.topCauses[0]?.name || 'Indéterminé');
    response = response.replace(/\{technical_explanation\}/g, data.topCauses[0]?.technical_explanation || '');

    // Construire la liste des top causes
    if (data.topCauses && data.topCauses.length > 0) {
      const causesText = data.topCauses.map((cause, index) => 
        `${index + 1}. **${cause.name}** (${Math.round(cause.score * 100)}%)`
      ).join('\n');
      response = response.replace(/\{top_causes\}/g, causesText);
    } else {
      response = response.replace(/\{top_causes\}/g, 'Analyse en cours...');
    }

    // Question suivante si en mode collecte
    const nextQuestion = this.getNextBestQuestion(data.session);
    if (nextQuestion) {
      response = response.replace(/\{question\}/g, nextQuestion.question);
      response = response.replace(/\{explanation\}/g, nextQuestion.explanation || '');
      response = response.replace(/\{additional_questions\}/g, nextQuestion.question);
    } else {
      response = response.replace(/\{question\}/g, 'Diagnostic en cours...');
      response = response.replace(/\{explanation\}/g, '');
      response = response.replace(/\{additional_questions\}/g, 'Plus d\'informations sur vos symptômes');
    }

    // Workflows recommandés
    const workflows = this.selectApplicableWorkflows(data.session, data.topCauses);
    const ctas = this.generateWorkflowCTAs(workflows);

    return {
      response: response,
      confidence: data.confidence / 100,
      top_causes: data.topCauses,
      ctas: ctas,
      current_progress: data.progress,
      question_type: nextQuestion?.type,
      options: nextQuestion?.options,
      session_state: data.session.state,
      next_question: nextQuestion ? {
        text: nextQuestion.question,
        explanation: nextQuestion.explanation
      } : null
    };
  }

  selectApplicableWorkflows(session, topCauses) {
    return Object.values(this.kb.workflows)
      .filter(workflow => this.isWorkflowApplicable(workflow, session, topCauses))
      .sort((a, b) => (b.success_probability || 0.5) - (a.success_probability || 0.5))
      .slice(0, 3);
  }

  generateWorkflowCTAs(workflows) {
    return workflows.map(workflow => ({
      type: workflow.category || 'action',
      title: this.getWorkflowIcon(workflow.category) + ' ' + workflow.name,
      description: `${Math.round((workflow.success_probability || 0.5) * 100)}% succès • Coût: ${'💰'.repeat(workflow.cost_level || 1)}`,
      action: workflow.id,
      success_rate: Math.round((workflow.success_probability || 0.5) * 100)
    }));
  }

  getWorkflowIcon(category) {
    const icons = {
      'self_service': '🔧',
      'professional': '👨‍🔧',
      'urgent': '🚨',
      'diagnostic': '🔍'
    };
    return icons[category] || '⚙️';
  }

  // Parsing réponse utilisateur
  parseUserResponse(input, expectedSignal) {
    if (!expectedSignal) return { type: 'free_text', content: input };

    const cleaned = input.toLowerCase().trim();

    // Réponses ambiguës
    const ambiguous = ['je ne sais pas', 'peut-être', 'pas sûr'];
    if (ambiguous.some(phrase => cleaned.includes(phrase))) {
      return { type: 'ambiguous', suggestion: 'need_help' };
    }

    // Selon type de signal
    switch (expectedSignal.type) {
      case 'multiple_choice':
        return this.parseMultipleChoice(cleaned, expectedSignal);
      case 'text_input':
        return this.parseTextInput(cleaned, expectedSignal);
      default:
        return { type: 'parsed', content: input };
    }
  }

  parseMultipleChoice(input, signal) {
    const matches = [];
    
    signal.options.forEach(option => {
      const keywords = option.label.toLowerCase().split(/\s+/);
      const hasMatch = keywords.some(keyword => input.includes(keyword));
      if (hasMatch) matches.push(option);
    });

    if (matches.length === 1) {
      return { type: 'single_match', selected: matches[0] };
    } else if (matches.length > 1) {
      return { type: 'multiple_matches', candidates: matches };
    } else {
      return { type: 'no_match', suggestion: 'rephrase' };
    }
  }

  parseTextInput(input, signal) {
    const detected = [];
    
    if (signal.patterns) {
      signal.patterns.forEach(pattern => {
        if (input.includes(pattern.pattern.toLowerCase())) {
          detected.push(pattern);
        }
      });
    }

    return {
      type: 'text_analyzed',
      detected_patterns: detected,
      urgent: detected.some(p => p.urgent)
    };
  }

  // Interface principale
  async processMessage(sessionId, message, context = {}) {
    try {
      const session = this.getSession(sessionId);
      
      // Ajouter à l'historique
      session.conversation_history.push({
        type: 'user',
        message: message,
        timestamp: new Date()
      });

      let response;

      // Traitement selon état
      switch (session.state) {
        case 'initial':
          response = await this.handleInitialMessage(session, message);
          break;
        case 'gathering_info':
          response = await this.handleInformationGathering(session, message);
          break;
        default:
          response = await this.handleInitialMessage(session, message);
      }

      // Enregistrer réponse
      session.conversation_history.push({
        type: 'assistant',
        response: response,
        timestamp: new Date()
      });

      this.updateSession(sessionId, session);
      return response;

    } catch (error) {
      console.error('Erreur processMessage:', error);
      return {
        response: "Problème technique temporaire. Pouvez-vous reformuler ?",
        error: true,
        ctas: [{
          type: 'contact',
          title: '📞 Contacter un expert',
          action: 'contact_support'
        }]
      };
    }
  }

  async handleInitialMessage(session, message) {
    // Extraire signaux du message
    const detectedSignals = this.extractSignalsFromMessage(message);
    Object.assign(session.collected_signals, detectedSignals);
    
    // Calculer scores
    session.current_scores = this.calculateProbabilityScores(session.collected_signals);
    
    // Décider de l'étape suivante
    const topCause = this.getTopCauses(session.current_scores, 1)[0];
    
    if (topCause && topCause.score > 0.75) {
      session.state = 'diagnosis_ready';
      return this.generateDiagnosisResponse(session, topCause);
    } else {
      session.state = 'gathering_info';
      return this.generateResponse(session);
    }
  }

  async handleInformationGathering(session, message) {
    const nextQuestion = this.getNextBestQuestion(session);
    
    if (nextQuestion) {
      // Parser la réponse
      const parsed = this.parseUserResponse(message, nextQuestion);
      
      if (parsed.type === 'single_match') {
        session.collected_signals[nextQuestion.id] = parsed.selected.id;
      } else if (parsed.type === 'text_analyzed') {
        session.collected_signals[nextQuestion.id] = parsed.detected_patterns;
      } else if (parsed.type === 'ambiguous') {
        // Gérer les réponses ambiguës avec aide
        return {
          response: `Je n'ai pas bien compris votre réponse "${message}". \n\nPouvez-vous être plus précis ?\n\n**${nextQuestion.question}**\n\n💡 ${nextQuestion.explanation}`,
          question_type: nextQuestion.type,
          options: nextQuestion.options,
          current_progress: this.calculateProgress(session),
          ctas: [{
            type: 'help',
            title: '❓ Besoin d\'aide',
            action: 'show_help'
          }]
        };
      }
    }

    // Recalculer scores
    session.current_scores = this.calculateProbabilityScores(session.collected_signals);
    
    // Vérifier si on peut conclure
    const topCause = this.getTopCauses(session.current_scores, 1)[0];
    if (topCause && topCause.score > 0.8) {
      session.state = 'diagnosis_ready';
      return this.generateDiagnosisResponse(session, topCause);
    }
    
    // Continuer la collecte
    return this.generateResponse(session);
  }

  calculateProgress(session) {
    const totalSignals = Object.keys(this.kb.signals).length;
    const collectedSignals = Object.keys(session.collected_signals).length;
    return Math.round((collectedSignals / totalSignals) * 100);
  }

  generateDiagnosisResponse(session, topCause) {
    const workflow = this.selectBestWorkflow(session, [topCause]);
    
    return {
      response: `🎯 **Diagnostic (${Math.round(topCause.score * 100)}% certitude)**\n\n` +
                `**Problème :** ${topCause.name}\n\n` +
                `**Explication :** ${topCause.technical_explanation}\n\n` +
                `**Solution recommandée :** ${workflow?.name || 'Diagnostic professionnel'}`,
      confidence: topCause.score,
      top_causes: [topCause],
      recommended_workflow: workflow,
      ctas: workflow ? this.generateWorkflowCTAs([workflow]) : []
    };
  }

  // Fallback IA (votre système existant)
  async getFallbackResponse(message) {
    if (!CLAUDE_API_KEY) {
      return "Base de diagnostic non disponible. Décrivez vos symptômes FAP pour un conseil général.";
    }

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
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Tu es Julien, expert FAP Re-Fap. Question: ${message}. Réponds brièvement et professionnellement.`
          }]
        })
      });

      const data = await response.json();
      return data.content?.[0]?.text || "Erreur IA. Contactez notre équipe.";
    } catch (error) {
      console.error('Erreur Claude:', error);
      return "IA temporairement indisponible. Contactez directement notre expert.";
    }
  }
}

// ==================== INITIALISATION ====================
loadKnowledgeBase();
const diagnosticEngine = new FAPDiagnosticEngine(KNOWLEDGE_BASE);

// ==================== ROUTES API ====================

// Route principale de chat
app.post('/api/chat', async (req, res) => {
  // Headers CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { message, session_id } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Message requis',
        timestamp: new Date().toISOString()
      });
    }

    const sessionId = session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`💬 Session ${sessionId.split('_')[1]}: "${message}"`);

    // Traitement avec timeout
    const processPromise = diagnosticEngine.processMessage(sessionId, message);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 8000)
    );

    const result = await Promise.race([processPromise, timeoutPromise]);
    
    // Si confiance faible, utiliser fallback IA
    if (result.confidence < 0.3 && !result.top_causes?.length) {
      console.log('🤖 Fallback IA activé...');
      const aiResponse = await diagnosticEngine.getFallbackResponse(message);
      
      return res.json({
        success: true,
        session_id: sessionId,
        response: aiResponse,
        source: 'ai_fallback',
        confidence: 0.6,
        ctas: [{
          type: 'contact',
          title: '📞 Expert disponible',
          description: 'Diagnostic personnalisé',
          action: 'contact_expert'
        }],
        timestamp: new Date().toISOString()
      });
    }

    // Réponse du moteur expert
    res.json({
      success: true,
      session_id: sessionId,
      ...result,
      source: 'diagnostic_engine',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur API chat:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur serveur temporaire',
      fallback_response: "🔧 **Conseils FAP généraux :**\n\n• Voyant moteur + perte puissance = Probable FAP colmaté\n• Essayez trajet autoroute 30+ km à 90+ km/h\n• Si persistant : contactez professionnel FAP Re-Fap",
      ctas: [{
        type: 'contact',
        title: '📞 Assistance directe',
        action: 'emergency_contact'
      }],
      timestamp: new Date().toISOString()
    });
  }
});

// Route feedback workflow
app.post('/api/workflow-feedback', async (req, res) => {
  try {
    const { session_id, workflow_id, result, feedback } = req.body;
    
    // Enregistrer feedback (version simple)
    console.log(`📊 Feedback: ${workflow_id} = ${result} (${feedback})`);
    
    res.json({
      success: true,
      message: 'Feedback enregistré, merci !'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check amélioré
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    version: '2.0.0-integrated',
    timestamp: new Date().toISOString(),
    engine: {
      knowledge_base: {
        version: KNOWLEDGE_BASE.version,
        signals: Object.keys(KNOWLEDGE_BASE.signals).length,
        causes: Object.keys(KNOWLEDGE_BASE.causes).length,
        workflows: Object.keys(KNOWLEDGE_BASE.workflows).length
      },
      active_sessions: diagnosticEngine.sessions.size,
      claude_ai: CLAUDE_API_KEY ? 'Disponible' : 'Non configuré'
    },
    server: {
      port: port,
      uptime: process.uptime(),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
    }
  });
});

// Test direct (pour debug)
app.get('/api/test/:query', async (req, res) => {
  try {
    const query = decodeURIComponent(req.params.query);
    const sessionId = `test_${Date.now()}`;
    
    const result = await diagnosticEngine.processMessage(sessionId, query);
    
    res.json({
      success: true,
      query: query,
      result: result,
      debug: {
        session_id: sessionId,
        kb_version: KNOWLEDGE_BASE.version
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      query: req.params.query
    });
  }
});

// Interface principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware d'erreur global
app.use((err, req, res, next) => {
  console.error('❌ Erreur globale:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({
    success: false,
    error: 'Erreur serveur inattendue',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Contactez le support'
  });
});

// ==================== DÉMARRAGE SERVEUR ====================
app.listen(port, () => {
  console.log(`🚀 FAP Re-Fap Expert v2.0 - PORT ${port}`);
  console.log(`📚 Base de connaissances: ${KNOWLEDGE_BASE.version}`);
  console.log(`🧠 Moteur diagnostic: ✅ Opérationnel`);
  console.log(`🤖 Claude AI: ${CLAUDE_API_KEY ? '✅' : '❌'} ${CLAUDE_API_KEY ? 'Configuré' : 'Variable manquante'}`);
  console.log(`🌐 Interface: http://localhost:${port}`);
  console.log(`✅ SYSTÈME INTÉGRÉ PRÊT !`);
});
