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
      current_progress: 0
    };
    this.sessions.set(sessionId, session);
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

  // ==================== QUESTIONS INTELLIGENTES ====================
  getNextBestQuestion(session) {
    const { collected_signals } = session;
    
    console.log('🔍 Signaux collectés:', Object.keys(collected_signals));
    
    // Signaux disponibles par ordre de priorité
    const signalsPriority = [
      'dashboard_lights',
      'power_loss', 
      'exhaust_smoke',
      'driving_pattern',
      'vehicle_mileage'
    ];
    
    // Trouver le premier signal non collecté
    for (const signalId of signalsPriority) {
      if (!collected_signals[signalId] && this.kb.signals[signalId]) {
        console.log(`➡️ Prochaine question: ${signalId}`);
        return this.kb.signals[signalId];
      }
    }
    
    console.log('✅ Toutes les questions principales ont été posées');
    return null; // Toutes les questions importantes ont été posées
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
        }]
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
    
    // Décider de l'étape suivante
    const topCause = this.getTopCauses(session.current_scores, 1)[0];
    
    if (topCause && topCause.score > 0.8) {
      session.state = 'diagnosis_ready';
      console.log('✅ Diagnostic immédiat possible');
      return this.generateDiagnosisResponse(session, topCause);
    } else {
      session.state = 'gathering_info';
      console.log('🔍 Collecte d\'informations nécessaire');
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
    
    return {
      response: `🎯 **Diagnostic (${Math.round(topCause.score * 100)}% certitude)**\n\n` +
                `**Problème :** ${topCause.name}\n\n` +
                `**Explication :** ${topCause.technical_explanation}\n\n` +
                `**Solution recommandée :** ${workflow?.name || 'Diagnostic professionnel'}`,
      confidence: topCause.score,
      top_causes: [topCause],
      recommended_workflow: workflow,
      ctas: workflow ? this.generateWorkflowCTAs([workflow]) : [],
      current_progress: Math.max(progress, 80), // Au moins 80% si diagnostic prêt
      session_state: 'diagnosis_complete'
    };
  }

  // ==================== GESTION DU SUIVI WORKFLOW ====================
  async handleWorkflowFeedback(sessionId, workflowId, result, userMessage) {
    const session = this.getSession(sessionId);
    
    console.log(`📊 Feedback workflow ${workflowId}: ${result}`);
    
    // Enregistrer le résultat
    session.attempted_workflows.push({
      workflow_id: workflowId,
      result: result,
      timestamp: new Date(),
      user_message: userMessage
    });
    
    // Générer la réponse de suivi
    const workflow = this.kb.workflows[workflowId];
    const nextWorkflowId = workflow?.next_workflows?.[result];
    
    if (result === 'success') {
      return {
        response: `🎉 **Excellent !** La ${workflow?.name || 'solution'} a fonctionné !\n\n` +
                  `✅ **Conseils pour éviter que ça revienne :**\n` +
                  `• Faites un trajet autoroute 1x/semaine minimum\n` +
                  `• Évitez les trajets uniquement urbains\n` +
                  `• Utilisez un additif FAP mensuel en prévention\n\n` +
                  `💡 **Surveillez ces signaux d'alerte :**\n` +
                  `• Retour du voyant FAP/moteur\n` +
                  `• Nouvelle perte de puissance\n` +
                  `• Fumée noire à l'échappement`,
        confidence: 0.95,
        ctas: [
          {
            type: 'success',
            title: '🛒 Commander additif préventif',
            action: 'order_preventive_additive'
          },
          {
            type: 'info',
            title: '📚 Guide d\'entretien FAP',
            action: 'maintenance_guide'
          }
        ]
      };
      
    } else if (result === 'partial') {
      const nextWorkflow = nextWorkflowId ? this.kb.workflows[nextWorkflowId] : null;
      
      return {
        response: `🤔 **Amélioration partielle** - C'est un bon début !\n\n` +
                  `**Prochaine étape recommandée :**\n` +
                  `${nextWorkflow ? `🔧 ${nextWorkflow.name}` : '📞 Consultation professionnelle'}\n\n` +
                  `Cette approche graduée maximise vos chances de succès tout en minimisant les coûts.`,
        confidence: 0.75,
        ctas: nextWorkflow ? this.generateWorkflowCTAs([nextWorkflow]) : [
          {
            type: 'professional',
            title: '👨‍🔧 Diagnostic professionnel',
            action: 'professional_diagnosis'
          }
        ]
      };
      
    } else { // failure
      const nextWorkflow = nextWorkflowId ? this.kb.workflows[nextWorkflowId] : null;
      
      return {
        response: `😔 **La ${workflow?.name || 'solution'} n'a pas fonctionné**\n\n` +
                  `C'est normal, votre problème FAP est probablement plus avancé.\n\n` +
                  `**Solution suivante :**\n` +
                  `${nextWorkflow ? `🔧 ${nextWorkflow.name}` : '👨‍🔧 Intervention professionnelle recommandée'}\n\n` +
                  `💡 **Pas d'inquiétude :** Ce diagnostic progressif nous permet de trouver la solution exacte !`,
        confidence: 0.85,
        ctas: nextWorkflow ? this.generateWorkflowCTAs([nextWorkflow]) : [
          {
            type: 'urgent',
            title: '🚨 Diagnostic professionnel urgent',
            action: 'urgent_professional'
          }
        ]
      };
    }
  }
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
      uptime: Math.round(process.uptime()),
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
  console.log(`📊 Logs de debug activés`);
  console.log(`✅ SYSTÈME COMPLET PRÊT !`);
});
