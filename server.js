const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// NOUVEAU: Import Supabase
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// ==================== CONFIGURATION SUPABASE ====================
const supabaseUrl = process.env.SUPABASE_URL || 'https://ipoxyhgfnzcggohugzzh.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwb3h5aGdmbnpjZ2dvaHVnenpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDU2OTksImV4cCI6MjA2OTc4MTY5OX0.PmS4a7jWFEGoUcxJiPSuNAByNAclW8vSz14UsgOANq0';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔗 Supabase configuré:', supabaseUrl);

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

// ==================== FONCTIONS SUPABASE ====================

// Sauvegarder une session de diagnostic
async function saveSession(sessionData) {
  try {
    const { data, error } = await supabase
      .from('diagnostic_sessions')
      .insert([{
        session_id: sessionData.id,
        created_at: sessionData.created_at,
        state: sessionData.state,
        collected_signals: sessionData.collected_signals,
        current_scores: sessionData.current_scores,
        user_data: sessionData.user_data || {},
        diagnostic_result: sessionData.diagnostic_result || null,
        current_progress: sessionData.current_progress || 0
      }]);

    if (error) {
      console.error('❌ Erreur sauvegarde session:', error);
      return null;
    }
    
    console.log('✅ Session sauvegardée dans Supabase');
    return data;
  } catch (err) {
    console.error('❌ Erreur Supabase:', err);
    return null;
  }
}

// Mettre à jour une session
async function updateSessionInDB(sessionId, updates) {
  try {
    const { data, error } = await supabase
      .from('diagnostic_sessions')
      .update({
        state: updates.state,
        collected_signals: updates.collected_signals,
        current_scores: updates.current_scores,
        user_data: updates.user_data,
        diagnostic_result: updates.diagnostic_result,
        current_progress: updates.current_progress || 0,
        updated_at: new Date()
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('❌ Erreur update session:', error);
    }
    
    return data;
  } catch (err) {
    console.error('❌ Erreur Supabase update:', err);
  }
}

// Sauvegarder l'historique des messages
async function saveMessage(sessionId, sender, message, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        sender: sender,
        message: message,
        metadata: metadata,
        created_at: new Date()
      }]);

    if (error) {
      console.error('❌ Erreur sauvegarde message:', error);
    }
    
    return data;
  } catch (err) {
    console.error('❌ Erreur Supabase message:', err);
  }
}

// Sauvegarder les données utilisateur (immatriculation, code postal)
async function saveUserData(sessionId, userData) {
  try {
    const { data, error } = await supabase
      .from('user_data')
      .insert([{
        session_id: sessionId,
        immatriculation: userData.immatriculation,
        code_postal: userData.code_postal,
        phone: userData.phone || null,
        email: userData.email || null,
        created_at: new Date()
      }]);

    if (error) {
      console.error('❌ Erreur sauvegarde user data:', error);
    }
    
    return data;
  } catch (err) {
    console.error('❌ Erreur Supabase user data:', err);
  }
}

// Sauvegarder le feedback sur les workflows
async function saveWorkflowFeedback(sessionId, workflowId, result, userMessage) {
  try {
    const { data, error } = await supabase
      .from('workflow_feedback')
      .insert([{
        session_id: sessionId,
        workflow_id: workflowId,
        result: result,
        user_message: userMessage,
        created_at: new Date()
      }]);

    if (error) {
      console.error('❌ Erreur sauvegarde feedback:', error);
    }
    
    return data;
  } catch (err) {
    console.error('❌ Erreur Supabase feedback:', err);
  }
}

// Récupérer l'historique d'une session
async function getSessionHistory(sessionId) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération historique:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('❌ Erreur Supabase historique:', err);
    return [];
  }
}

// Statistiques globales
async function getGlobalStats() {
  try {
    // Nombre total de sessions
    const { count: totalSessions } = await supabase
      .from('diagnostic_sessions')
      .select('*', { count: 'exact', head: true });

    // Taux de succès des workflows
    const { data: feedbackData } = await supabase
      .from('workflow_feedback')
      .select('workflow_id, result');

    // Calculer les stats par workflow
    const workflowStats = {};
    if (feedbackData) {
      feedbackData.forEach(feedback => {
        if (!workflowStats[feedback.workflow_id]) {
          workflowStats[feedback.workflow_id] = {
            total: 0,
            success: 0,
            partial: 0,
            failure: 0
          };
        }
        workflowStats[feedback.workflow_id].total++;
        workflowStats[feedback.workflow_id][feedback.result]++;
      });
    }

    return {
      totalSessions,
      workflowStats
    };
  } catch (err) {
    console.error('❌ Erreur stats:', err);
    return null;
  }
}

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
        question: "Quels voyants sont allumés sur votre tableau de bord ?",
        explanation: "Les voyants nous donnent des indices précis sur le système défaillant",
        options: [
          {"id": "dpf_light", "label": "🟡 Voyant FAP", "weight": 5},
          {"id": "engine_light", "label": "🔶 Voyant moteur", "weight": 3},
          {"id": "no_lights", "label": "❌ Aucun voyant", "weight": 0}
        ]
      },
      power_loss: {
        id: "power_loss",
        type: "multiple_choice",
        question: "Décrivez la perte de puissance que vous ressentez :",
        explanation: "Le type de perte de puissance aide à identifier la cause",
        options: [
          {"id": "acceleration", "label": "🚗 À l'accélération", "weight": 4},
          {"id": "permanent", "label": "🔄 Permanente", "weight": 5},
          {"id": "no_loss", "label": "❌ Pas de perte", "weight": 0}
        ]
      }
    },
    causes: {
      dpf_clogged: {
        id: "dpf_clogged",
        name: "FAP colmaté",
        probability_base: 0.8,
        signal_weights: {
          dashboard_lights: {"dpf_light": 5, "engine_light": 3},
          power_loss: {"acceleration": 4, "permanent": 5}
        },
        technical_explanation: "Filtre à particules saturé en suie",
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
        template: "🎯 **Diagnostic avec {confidence}% de certitude**\n\n**Problème :** {cause_name}\n\n**Explication :** {technical_explanation}",
        tone: "confident"
      },
      diagnosis_confidence_medium: {
        template: "🔍 **Analyse en cours - {confidence}% de certitude**\n\nBasé sur vos symptômes, voici les causes les plus probables :\n\n{top_causes}\n\nPour affiner le diagnostic, j'ai besoin de :\n**{additional_questions}**",
        tone: "investigative"
      },
      gathering_information: {
        template: "🔍 **Collecte d'informations ({progress}%)**\n\n{question}\n\n💡 {explanation}",
        tone: "questioning"
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
    this.loadDecisionTrees();
    this.loadPostDiagnosticFlows();
  }

  // ==================== GESTION DE SESSION ====================
  createSession(sessionId) {
    const session = {
      id: sessionId,
      created_at: new Date(),
      state: 'initial',
      collected_signals: {},
      conversation_history: [],
      current_scores: {},
      attempted_workflows: [],
      current_progress: 0,
      user_data: {}
    };
    
    this.sessions.set(sessionId, session);
    
    // NOUVEAU: Sauvegarder dans Supabase
    saveSession(session);
    
    console.log(`✅ Nouvelle session créée: ${sessionId}`);
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
    
    // NOUVEAU: Mettre à jour dans Supabase
    updateSessionInDB(sessionId, session);
    
    return session;
  }

  // ==================== MOTEUR DE SCORING ====================
  calculateProbabilityScores(collectedSignals) {
    const scores = {};
    
    console.log('📊 Calcul scores pour signaux:', Object.keys(collectedSignals));
    
    // Initialiser avec probabilités de base
    Object.keys(this.kb.causes).forEach(causeId => {
      scores[causeId] = this.kb.causes[causeId].probability_base || 0.5;
    });

    // Appliquer les poids des signaux
    Object.entries(collectedSignals).forEach(([signalId, signalValue]) => {
      console.log(`🔍 Traitement signal ${signalId}:`, signalValue);
      
      Object.entries(this.kb.causes).forEach(([causeId, cause]) => {
        if (cause.signal_weights && cause.signal_weights[signalId]) {
          const signalWeights = cause.signal_weights[signalId];
          
          if (typeof signalValue === 'string' && signalWeights[signalValue]) {
            const weight = signalWeights[signalValue] * 0.05;
            scores[causeId] += weight;
            console.log(`  ✅ ${causeId}: +${weight} (total: ${scores[causeId].toFixed(2)})`);
          } else if (Array.isArray(signalValue)) {
            signalValue.forEach(option => {
              if (signalWeights[option]) {
                const weight = signalWeights[option] * 0.05;
                scores[causeId] += weight;
                console.log(`  ✅ ${causeId}: +${weight} (total: ${scores[causeId].toFixed(2)})`);
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

    console.log('📊 Scores finaux:', scores);
    return scores;
  }

  // ==================== EXTRACTION DE SIGNAUX ====================
  extractSignalsFromMessage(message) {
    const signals = {};
    const messageLower = message.toLowerCase();
    
    console.log('🔍 Extraction signaux depuis:', message);

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
          console.log(`📟 Code détecté: ${pattern.pattern}`);
        }
      });
      
      if (detectedCodes.length > 0) {
        signals.error_codes = detectedCodes;
      }
    }

    // Mots-clés symptômes
    const keywordMapping = {
      dashboard_lights: {
        keywords: ['voyant', 'témoin', 'allumé', 'clignote', 'fap', 'moteur'],
        options: {
          'fap': 'dpf_light',
          'moteur': 'engine_light',
          'adblue': 'adblue_light',
          'préchauffage': 'glow_plug'
        }
      },
      power_loss: {
        keywords: ['puissance', 'perte', 'mou', 'accélération', 'force'],
        options: {
          'accélération': 'acceleration',
          'acceleration': 'acceleration',
          'montée': 'uphill',
          'permanent': 'permanent',
          'autoroute': 'highway'
        }
      },
      exhaust_smoke: {
        keywords: ['fumée', 'fume', 'noir', 'blanc', 'bleu'],
        options: {
          'noir': 'black_smoke',
          'noire': 'black_smoke',
          'blanc': 'white_smoke',
          'blanche': 'white_smoke',
          'bleu': 'blue_smoke',
          'bleue': 'blue_smoke'
        }
      },
      driving_pattern: {
        keywords: ['ville', 'urbain', 'autoroute', 'court', 'long', 'trajet'],
        options: {
          'ville': 'city_only',
          'urbain': 'city_only',
          'autoroute': 'highway_frequent',
          'court': 'mixed_short'
        }
      }
    };

    Object.entries(keywordMapping).forEach(([signalId, config]) => {
      const matchCount = config.keywords.filter(keyword => messageLower.includes(keyword)).length;
      
      if (matchCount > 0) {
        // Essayer de détecter une option spécifique
        let detectedOption = null;
        Object.entries(config.options).forEach(([keyword, optionId]) => {
          if (messageLower.includes(keyword)) {
            detectedOption = optionId;
          }
        });
        
        signals[signalId] = {
          type: 'keyword_detected',
          confidence: Math.min(matchCount * 0.3, 1),
          matched_keywords: config.keywords.filter(keyword => messageLower.includes(keyword)),
          detected_option: detectedOption
        };
        
        console.log(`🔍 Signal détecté ${signalId}:`, signals[signalId]);
      }
    });

    return signals;
  }

  // Questions intelligentes avec ordre de priorité strict
  getNextBestQuestion(session) {
    const { collected_signals } = session;
    
    console.log('🔍 Signaux collectés:', Object.keys(collected_signals));
    
    // Ordre de priorité STRICT (codes d'erreur en premier)
    const signalsPriority = [
      'error_codes',        // Priority 0 - Le plus important
      'dashboard_lights',   // Priority 1 
      'power_loss',        // Priority 2
      'exhaust_smoke',     // Priority 3
      'driving_pattern',   // Priority 4
      'vehicle_mileage'    // Priority 5
    ];
    
    // Trouver le premier signal non collecté
    for (const signalId of signalsPriority) {
      if (!collected_signals[signalId] && this.kb.signals[signalId]) {
        console.log(`➡️ Prochaine question: ${signalId}`);
        return this.kb.signals[signalId];
      }
    }
    
    console.log('✅ Toutes les questions principales ont été posées');
    return null;
  }

  // ==================== SÉLECTION DE WORKFLOW ====================
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

  // ==================== PARSING ET VALIDATION ====================
  parseUserResponse(input, expectedSignal) {
    if (!expectedSignal) return { type: 'free_text', content: input };

    const cleaned = input.toLowerCase().trim();
    console.log(`🔍 Parsing: "${cleaned}" pour signal: ${expectedSignal.id}`);

    // Réponses ambiguës
    const ambiguous = ['je ne sais pas', 'peut-être', 'pas sûr', '?'];
    if (ambiguous.some(phrase => cleaned.includes(phrase))) {
      return { type: 'ambiguous', suggestion: 'need_help' };
    }

    // Selon type de signal
    switch (expectedSignal.type) {
      case 'multiple_choice':
        return this.parseMultipleChoiceSimple(cleaned, expectedSignal);
      case 'text_input':
        return this.parseTextInput(cleaned, expectedSignal);
      default:
        return { type: 'parsed', content: input };
    }
  }

  parseMultipleChoiceSimple(input, signal) {
    const matches = [];
    
    // Recherche plus flexible
    signal.options.forEach(option => {
      const optionText = option.label.toLowerCase();
      
      // Recherche par mots-clés de l'option
      const keywords = [
        option.id,
        ...optionText.split(/\s+/).filter(word => word.length > 2)
      ];
      
      const hasMatch = keywords.some(keyword => 
        input.includes(keyword) || 
        keyword.includes(input) ||
        this.similarity(input, keyword) > 0.6
      );
      
      if (hasMatch) {
        matches.push(option);
        console.log(`✅ Match trouvé: ${option.label}`);
      }
    });

    if (matches.length === 1) {
      return { type: 'single_match', selected: matches[0] };
    } else if (matches.length > 1) {
      return { type: 'multiple_matches', candidates: matches };
    } else {
      // Essayer de deviner selon le contexte
      return this.guessFromContext(input, signal);
    }
  }

  guessFromContext(input, signal) {
    // Mapping contextuel pour les réponses courantes
    const contextMappings = {
      dashboard_lights: {
        'voyant': 'engine_light',
        'moteur': 'engine_light', 
        'fap': 'dpf_light',
        'orange': 'engine_light',
        'jaune': 'dpf_light',
        'aucun': 'no_lights',
        'non': 'no_lights'
      },
      power_loss: {
        'accélération': 'acceleration',
        'acceleration': 'acceleration',
        'montée': 'uphill',
        'côte': 'uphill',
        'autoroute': 'highway',
        'permanent': 'permanent',
        'toujours': 'permanent',
        'non': 'no_loss',
        'aucune': 'no_loss'
      }
    };

    const mapping = contextMappings[signal.id];
    if (mapping) {
      for (const [keyword, optionId] of Object.entries(mapping)) {
        if (input.includes(keyword)) {
          const option = signal.options.find(opt => opt.id === optionId);
          if (option) {
            console.log(`🎯 Deviné depuis le contexte: ${option.label}`);
            return { type: 'single_match', selected: option };
          }
        }
      }
    }

    return { type: 'no_match', suggestion: 'rephrase' };
  }

  similarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s2.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s1.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(j - 1) !== s2.charAt(i - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s1.length] = lastValue;
    }
    return costs[s1.length];
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

  // ==================== GÉNÉRATION DE RÉPONSES ====================
  generateResponse(session, context = {}) {
    const { current_scores, collected_signals } = session;
    const topCauses = this.getTopCauses(current_scores, 3);
    const confidence = topCauses[0]?.score || 0;

    // Calculer progression
    const progress = this.calculateProgress(session);

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

  calculateProgress(session) {
    const totalSignals = Object.keys(this.kb.signals).length;
    const collectedSignals = Object.keys(session.collected_signals).length;
    return Math.round((collectedSignals / totalSignals) * 100);
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

  // ==================== INTERFACE PRINCIPALE ====================
  async processMessage(sessionId, message, context = {}) {
    try {
      const session = this.getSession(sessionId);
      
      console.log(`💬 [${sessionId}] Message: "${message}"`);
      console.log(`📊 [${sessionId}] État: ${session.state}`);
      
      // Ajouter le message à l'historique
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
          
        case 'executing_workflow':
          response = await this.handleWorkflowExecution(session, message);
          break;
          
        case 'workflow_feedback':
          response = await this.handleWorkflowFeedbackMessage(session, message);
          break;
          
        case 'post_diagnostic': // NOUVEAU
          response = await this.handlePostDiagnosticFlow(session, message);
          break;
          
        case 'collect_user_data': // NOUVEAU
          response = await this.handleUserDataCollection(session, message);
          break;
          
        default:
          response = await this.handleInitialMessage(session, message);
      }

      // Enregistrer la réponse
      session.conversation_history.push({
        type: 'assistant',
        response: response,
        timestamp: new Date()
      });

      this.updateSession(sessionId, session);
      
      console.log(`✅ [${sessionId}] Réponse générée (confiance: ${Math.round((response.confidence || 0) * 100)}%)`);
      
      return response;

    } catch (error) {
      console.error(`❌ [${sessionId}] Erreur processMessage:`, error);
      return {
        response: "Problème technique temporaire. Pouvez-vous reformuler ?",
        error: true,
        ctas: [{
          type: 'contact',
          title: '📞 Contacter un expert',
          action: 'contact_support'
        }],
        timestamp: new Date().toISOString()
      };
    }
  }

  async handleInitialMessage(session, message) {
    console.log('🆕 Traitement message initial');
    
    // Extraire signaux du message
    const detectedSignals = this.extractSignalsFromMessage(message);
    
    // Convertir les signaux détectés en signaux collectés
    Object.entries(detectedSignals).forEach(([signalId, signalData]) => {
      if (signalData.detected_option) {
        session.collected_signals[signalId] = signalData.detected_option;
        console.log(`✅ Signal auto-détecté: ${signalId} = ${signalData.detected_option}`);
      }
    });
    
    // Calculer scores
    session.current_scores = this.calculateProbabilityScores(session.collected_signals);
    
    // FORCER le mode questions si moins de 3 signaux collectés
    const collectedCount = Object.keys(session.collected_signals).length;
    const topCause = this.getTopCauses(session.current_scores, 1)[0];
    
    console.log(`📊 Signaux collectés: ${collectedCount}, Top cause: ${topCause?.name} (${Math.round((topCause?.score || 0) * 100)}%)`);
    
    // TOUJOURS forcer au moins 2 questions minimum
    if (collectedCount < 2) {
      session.state = 'gathering_info';
      console.log(`🔍 Mode questions forcé (${collectedCount}/2 signaux minimum)`);
      return this.generateResponse(session);
    }
    
    // Seuil plus strict : au moins 4 signaux ET confiance > 85%
    if (collectedCount >= 4 && topCause && topCause.score > 0.85) {
      session.state = 'diagnosis_ready';
      console.log('✅ Diagnostic immédiat possible');
      return this.generateDiagnosisResponse(session, topCause);
    } else {
      session.state = 'gathering_info';
      console.log(`🔍 Collecte d\'informations nécessaire (${collectedCount}/6 signaux)`);
      return this.generateResponse(session);
    }
  }

  async handleInformationGathering(session, message) {
    console.log('📝 Traitement collecte d\'info:', message);
    
    const nextQuestion = this.getNextBestQuestion(session);
    console.log('❓ Question attendue:', nextQuestion?.id);
    
    if (nextQuestion) {
      // Parser la réponse
      const parsed = this.parseUserResponse(message, nextQuestion);
      console.log('🔍 Résultat parsing:', parsed);
      
      if (parsed.type === 'single_match') {
        // IMPORTANT: Marquer ce signal comme collecté
        session.collected_signals[nextQuestion.id] = parsed.selected.id;
        console.log(`✅ Signal enregistré: ${nextQuestion.id} = ${parsed.selected.id}`);
        
      } else if (parsed.type === 'multiple_matches') {
        // Demander clarification
        const options = parsed.candidates.map(c => c.label).join(', ');
        return {
          response: `J'ai trouvé plusieurs correspondances possibles: ${options}.\n\nPouvez-vous être plus précis ?`,
          question_type: nextQuestion.type,
          options: parsed.candidates,
          current_progress: this.calculateProgress(session)
        };
        
      } else if (parsed.type === 'text_analyzed') {
        session.collected_signals[nextQuestion.id] = parsed.detected_patterns;
        console.log(`✅ Patterns enregistrés: ${nextQuestion.id}`);
        
      } else if (parsed.type === 'ambiguous' || parsed.type === 'no_match') {
        // Aide contextuelle
        return {
          response: `Je n'ai pas bien compris "${message}". \n\n**${nextQuestion.question}**\n\n💡 ${nextQuestion.explanation}\n\nExemples de réponses: ${nextQuestion.options.map(o => o.label).join(', ')}`,
          question_type: nextQuestion.type,
          options: nextQuestion.options,
          current_progress: this.calculateProgress(session),
          next_question: {
            text: nextQuestion.question,
            explanation: nextQuestion.explanation
          }
        };
      }
    }

    // Recalculer scores APRÈS avoir enregistré la réponse
    session.current_scores = this.calculateProbabilityScores(session.collected_signals);
    console.log('📊 Scores mis à jour:', session.current_scores);
    
    // Vérifier si on peut conclure
    const topCause = this.getTopCauses(session.current_scores, 1)[0];
    console.log('🎯 Top cause:', topCause?.name, topCause?.score);
    
    if (topCause && topCause.score > 0.8) {
      session.state = 'diagnosis_ready';
      console.log('✅ Diagnostic prêt !');
      return this.generateDiagnosisResponse(session, topCause);
    }
    
    // Continuer la collecte avec la PROCHAINE question
    console.log('➡️ Continuer la collecte...');
    return this.generateResponse(session);
  }

  async handleWorkflowExecution(session, message) {
    // Détection si l'utilisateur signale un résultat
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('ça marche') || messageLower.includes('fonctionne') || 
        messageLower.includes('résolu') || messageLower.includes('plus de voyant')) {
      session.state = 'workflow_feedback';
      return this.handleWorkflowFeedback(session.id, 'highway_regeneration', 'success', message);
    }
    
    if (messageLower.includes('ça marche pas') || messageLower.includes('toujours') || 
        messageLower.includes('encore le problème') || messageLower.includes('pas mieux')) {
      session.state = 'workflow_feedback';
      return this.handleWorkflowFeedback(session.id, 'highway_regeneration', 'failure', message);
    }
    
    if (messageLower.includes('un peu mieux') || messageLower.includes('partiellement') || 
        messageLower.includes('moins fort')) {
      session.state = 'workflow_feedback';
      return this.handleWorkflowFeedback(session.id, 'highway_regeneration', 'partial', message);
    }
    
    // Si pas de retour clair, demander le statut
    return {
      response: `⏰ **Suivi de votre régénération autoroute**\n\n` +
                `Comment ça s'est passé ?\n\n` +
                `• Le trajet de 30+ km est-il terminé ?\n` +
                `• Les voyants se sont-ils éteints ?\n` +
                `• Avez-vous retrouvé la puissance ?`,
      ctas: [
        {
          type: 'success',
          title: '✅ Ça marche !',
          action: 'workflow_success'
        },
        {
          type: 'partial',
          title: '🤔 Un peu mieux',
          action: 'workflow_partial'
        },
        {
          type: 'failure',
          title: '❌ Toujours le problème',
          action: 'workflow_failure'
        }
      ]
    };
  }

  async handleWorkflowFeedbackMessage(session, message) {
    // Traitement des retours sur les workflows
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('succès') || messageLower.includes('marche')) {
      return this.handleWorkflowFeedback(session.id, 'highway_regeneration', 'success', message);
    } else if (messageLower.includes('partiel') || messageLower.includes('mieux')) {
      return this.handleWorkflowFeedback(session.id, 'highway_regeneration', 'partial', message);
    } else {
      return this.handleWorkflowFeedback(session.id, 'highway_regeneration', 'failure', message);
    }
  }

  generateDiagnosisResponse(session, topCause) {
    const workflow = this.selectBestWorkflow(session, [topCause]);
    const progress = this.calculateProgress(session);
    
    // NOUVEAU: Utiliser les CTA post-diagnostic enrichis
    const postDiagnosticCTAs = this.generatePostDiagnosticCTAs(session, topCause);
    
    // Mettre à jour l'état pour le flux post-diagnostic
    session.state = 'post_diagnostic';
    session.current_flow = 'fap_related';
    session.current_step = 'ask_garage';
    
    // Sauvegarder le résultat du diagnostic
    session.diagnostic_result = {
      cause: topCause,
      confidence: topCause.score,
      timestamp: new Date()
    };
    
    return {
      response: `🎯 **Diagnostic (${Math.round(topCause.score * 100)}% certitude)**\n\n` +
                `**Problème :** ${topCause.name}\n\n` +
                `**Explication :** ${topCause.technical_explanation}\n\n` +
                `**Comment veux-tu résoudre ton problème FAP ?**`,
      confidence: topCause.score,
      top_causes: [topCause],
      recommended_workflow: workflow,
      ctas: postDiagnosticCTAs,
      current_progress: Math.max(progress, 80),
      session_state: 'post_diagnostic',
      post_diagnostic_active: true
    };
  }

  // ==================== SYSTÈME D'ARBRE DE DÉCISION ====================
  
  loadDecisionTrees() {
    // En production, charger depuis un fichier JSON externe
    // Pour l'instant, intégré dans le code
    this.decisionTrees = {
      "dpf_clogged_tree": {
        "trigger_conditions": { "cause": "dpf_clogged", "confidence": 0.7 },
        "nodes": {
          "self_service_path": {
            "type": "workflow_sequence",
            "title": "🛠️ Solutions Auto-Service",
            "description": "Commençons par les solutions que vous pouvez faire vous-même",
            "ctas": [
              {
                "type": "primary",
                "title": "🛣️ Démarrer régénération autoroute",
                "action": "start_highway_regeneration", 
                "description": "30-45 min • Gratuit • 65% de succès"
              },
              {
                "type": "secondary",
                "title": "🧴 Traitement additif d'abord",
                "action": "start_additive_first",
                "description": "Si vous préférez l'additif"
              },
              {
                "type": "info", 
                "title": "👨‍🔧 Passer au professionnel",
                "action": "skip_to_professional",
                "description": "Solution garantie directement"
              }
            ]
          },
          "additive_treatment": {
            "type": "workflow_sequence",
            "title": "🧴 Traitement Additif FAP",
            "description": "La régénération n'a pas suffi, essayons l'additif",
            "ctas": [
              {
                "type": "primary",
                "title": "🛒 Commander additif FAP Re-Fap",
                "action": "order_additive",
                "description": "Livraison 24h • Guide inclus"
              },
              {
                "type": "secondary",
                "title": "📋 J'ai déjà l'additif",
                "action": "guide_additive_usage", 
                "description": "Guide d'utilisation"
              }
            ]
          },
          "professional_diagnosis": {
            "type": "workflow_sequence",
            "title": "👨‍🔧 Diagnostic Professionnel",
            "description": "Diagnostic précis nécessaire",
            "ctas": [
              {
                "type": "primary",
                "title": "📞 Prendre RDV diagnostic",
                "action": "book_diagnostic",
                "description": "30€ • Déduit si intervention"
              },
              {
                "type": "urgent",
                "title": "🚨 Diagnostic d'urgence",
                "action": "emergency_diagnostic",
                "description": "Si le problème s'aggrave"
              }
            ]
          },
          "monitor_prevention": {
            "type": "follow_up",
            "title": "✅ Problème Résolu - Surveillance",
            "description": "Voici comment éviter que ça revienne",
            "ctas": [
              {
                "type": "prevention",
                "title": "📅 Entretien préventif",
                "action": "schedule_maintenance",
                "description": "Tous les 15 000 km"
              },
              {
                "type": "product",
                "title": "🛒 Additif préventif",
                "action": "subscribe_preventive",
                "description": "Abonnement • -20%"
              }
            ]
          }
        }
      }
    };
  }

  getDecisionTree(session, topCause) {
    const cause = topCause.id;
    const confidence = topCause.score;
    
    // Trouver l'arbre de décision approprié
    for (const [treeId, tree] of Object.entries(this.decisionTrees)) {
      const conditions = tree.trigger_conditions;
      if (conditions.cause === cause && confidence >= conditions.confidence) {
        return { treeId, tree };
      }
    }
    
    return null;
  }

  getCurrentDecisionNode(session, treeId) {
    // Déterminer le nœud actuel selon l'historique
    const attemptedWorkflows = session.attempted_workflows || [];
    
    if (attemptedWorkflows.length === 0) {
      return "self_service_path";
    }
    
    const lastAttempt = attemptedWorkflows[attemptedWorkflows.length - 1];
    
    // Logique de progression selon les résultats
    if (lastAttempt.workflow_id === "highway_regeneration") {
      switch (lastAttempt.result) {
        case "success": return "monitor_prevention";  
        case "partial": return "additive_treatment";
        case "failure": return "professional_diagnosis";
      }
    }
    
    if (lastAttempt.workflow_id === "additive_treatment") {
      switch (lastAttempt.result) {
        case "success": return "monitor_prevention";
        case "partial": 
        case "failure": return "professional_diagnosis";
      }
    }
    
    return "self_service_path"; // Default
  }

  generateDecisionCTAs(session, topCause) {
    const decisionResult = this.getDecisionTree(session, topCause);
    
    if (!decisionResult) {
      // Fallback vers les CTA standards
      return this.generateWorkflowCTAs(this.selectApplicableWorkflows(session, [topCause]));
    }
    
    const { treeId, tree } = decisionResult;
    const currentNode = this.getCurrentDecisionNode(session, treeId);
    const nodeData = tree.nodes[currentNode];
    
    if (!nodeData) {
      return [];
    }
    
    console.log(`🌳 Arbre de décision: ${treeId}, Nœud: ${currentNode}`);
    
    // Ajouter des métadonnées aux CTA
    return nodeData.ctas.map(cta => ({
      ...cta,
      node: currentNode,
      tree: treeId,
      enhanced: true
    }));
  }
  
  // ==================== NOUVEAU: SYSTÈME POST-DIAGNOSTIC ====================
  
  loadPostDiagnosticFlows() {
    this.postDiagnosticFlows = {
      "fap_related": {
        "ask_garage": {
          "question": "As-tu besoin d'un garage de confiance pour confirmer et prendre en charge ton problème de FAP ?",
          "yes": {
            "action": "collect_immat_cp",
            "next": "list_and_offer_garages",
            "message": "Parfait ! Je vais te trouver les meilleurs garages près de chez toi. J'ai besoin de ton immatriculation et code postal."
          },
          "no": {
            "next": "ask_is_handyman"
          }
        },
        "ask_is_handyman": {
          "question": "Tu es bricoleur ? Tu peux démonter ton FAP toi-même ?",
          "yes": {
            "offer": "refap_cleaning",
            "options": {
              "callback": {
                "question": "Tu veux être rappelé ?",
                "yes": { "action": "trigger_callback_form" },
                "no": { "action": "show_order_link" }
              }
            }
          },
          "no": {
            "offer_alternative": "carter_cash",
            "link": "https://auto.re-fap.fr/"
          }
        }
      },
      "non_fap": {
        "message": "Même si ce n'est pas un problème de FAP, je recommande de faire un diagnostic professionnel pour être sûr.",
        "ask_appointment": {
          "question": "Tu veux organiser un RDV diagnostic près de chez toi rapidement ?",
          "yes": {
            "action": "collect_immat_cp",
            "next": "list_and_offer_garages",
