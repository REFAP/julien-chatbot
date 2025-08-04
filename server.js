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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// ==================== BASE CONVERSATIONNELLE FAP COMPLÈTE ====================
const FAP_CONVERSATION_DATABASE = {
  
  conversation_steps: {
    'welcome': {
      message: "Bonjour ! Je suis Julien, votre expert FAP Re-Fap. Décrivez-moi le problème que vous rencontrez avec votre véhicule.",
      type: 'open_text',
      fap_keywords: ['voyant', 'fap', 'filtre', 'particules', 'fumée', 'puissance', 'P2002', 'P2463', 'régénération', 'colmaté'],
      next_if_fap: 'fap_symptom_detection',
      next_if_other: 'general_diagnosis'
    },

    'fap_symptom_detection': {
      message: "Parfait, je vais vous aider avec votre problème de FAP. Le témoin de FAP (ou moteur) est-il allumé sur votre tableau de bord ?",
      type: 'yes_no',
      options: {
        'oui': 'get_error_codes',
        'non': 'fap_physical_symptoms',
        'ne_sais_pas': 'explain_fap_warning'
      }
    },

    'explain_fap_warning': {
      message: "Le voyant FAP ressemble souvent à un moteur orange, ou parfois à un filtre avec des particules. Voyez-vous un voyant orange/rouge allumé ?",
      type: 'yes_no',
      options: {
        'oui': 'get_error_codes',
        'non': 'fap_physical_symptoms'
      }
    },

    'get_error_codes': {
      message: "Avez-vous un code d'erreur ? (comme P2002, P2463, P244A, etc.) Si vous ne savez pas, je peux vous expliquer comment l'obtenir.",
      type: 'text_with_help',
      validation: /P[0-9A-F]{4}/gi,
      options: {
        'help': 'explain_obd_reading',
        'no_code': 'fap_symptoms_with_light'
      }
    },

    'fap_physical_symptoms': {
      message: "D'accord. Ressentez-vous une perte de puissance, surtout lors des accélérations ?",
      type: 'yes_no',
      options: {
        'oui': 'check_fap_smoke',
        'non': 'check_fap_consumption'
      }
    },

    'check_fap_smoke': {
      message: "Y a-t-il de la fumée à l'échappement ? Si oui, de quelle couleur ?",
      type: 'multiple_choice',
      options: {
        'aucune': 'fap_consumption_check',
        'noire': 'black_smoke_fap_analysis',
        'blanche': 'white_smoke_analysis',
        'bleue': 'other_engine_issue'
      }
    },

    'black_smoke_fap_analysis': {
      message: "Fumée noire = souvent FAP colmaté ! Cette fumée apparaît-elle principalement à l'accélération ou en permanence ?",
      type: 'multiple_choice',
      options: {
        'acceleration': 'fap_clogged_acceleration',
        'permanent': 'fap_severely_clogged',
        'demarrage_froid': 'fap_cold_start_issue'
      }
    },

    'fap_driving_analysis': {
      message: "Voici la question clé ! Faites-vous principalement des trajets urbains courts (moins de 15-20 min) ou des trajets plus longs sur route/autoroute ?",
      type: 'multiple_choice',
      options: {
        'urbain_court': 'urban_fap_issue',
        'mixte': 'mixed_driving_fap',
        'autoroute_long': 'highway_fap_ok',
        'tres_varie': 'varied_driving_fap'
      }
    },

    'urban_fap_issue': {
      message: "🚨 Voilà le problème ! Les trajets urbains courts empêchent la régénération du FAP. Le FAP a besoin de 600°C pour brûler la suie, impossible en ville ! À quelle fréquence faites-vous des trajets d'autoroute de plus de 30 km ?",
      type: 'multiple_choice',
      education: "En ville, le moteur ne chauffe jamais assez longtemps. C'est comme essayer de nettoyer un four sale en ne l'allumant que 5 minutes !",
      options: {
        'jamais': 'critical_fap_regeneration_issue',
        'rarement': 'insufficient_fap_regeneration', 
        'parfois': 'occasional_fap_regeneration',
        'regulierement': 'sufficient_fap_regeneration'
      }
    },

    'critical_fap_regeneration_issue': {
      message: "🚨 Situation critique ! Sans trajets longs, votre FAP ne peut JAMAIS se régénérer naturellement. Pouvez-vous faire un trajet d'autoroute de 30+ km dans les 48h ?",
      type: 'yes_no',
      urgency: 'high',
      options: {
        'oui': 'emergency_fap_regeneration_protocol',
        'non': 'urgent_fap_professional_cleaning'
      }
    }
  },

  // Codes d'erreur FAP spécialisés
  fap_error_codes: {
    'P2002': {
      title: "FAP - Efficacité en dessous du seuil",
      severity: 'high',
      confidence: 90,
      description: "Votre FAP ne filtre plus efficacement. Il est probablement colmaté par la suie.",
      causes: [
        { cause: "Conduite urbaine exclusive", probability: 70, solution: "fap_regeneration_protocol" },
        { cause: "FAP saturé en suie", probability: 85, solution: "professional_fap_cleaning" },
        { cause: "Capteur pression HS", probability: 10, solution: "sensor_replacement" }
      ],
      immediate_questions: ['driving_pattern', 'last_regeneration'],
      next_step: 'p2002_fap_deep_dive'
    },

    'P2463': {
      title: "Accumulation excessive de suie FAP",
      severity: 'critical',
      confidence: 95,
      description: "⚠️ Niveau de suie critique ! Intervention urgente nécessaire.",
      causes: [
        { cause: "Conduite urbaine excessive", probability: 80, solution: "immediate_regeneration" },
        { cause: "Injecteurs défectueux", probability: 15, solution: "injector_cleaning" },
        { cause: "EGR encrassé", probability: 5, solution: "egr_service" }
      ],
      urgency: 'immediate',
      next_step: 'p2463_emergency_protocol'
    },

    'P244A': {
      title: "Pression différentielle FAP trop faible",
      severity: 'medium',
      confidence: 75,
      description: "Capteur détecte une pression anormalement basse. Possible fuite ou capteur défectueux.",
      causes: [
        { cause: "Capteur pression défectueux", probability: 60, solution: "sensor_diagnosis" },
        { cause: "Fuites conduits FAP", probability: 30, solution: "leak_inspection" },
        { cause: "FAP percé", probability: 10, solution: "fap_replacement" }
      ],
      next_step: 'p244a_sensor_check'
    },

    'P244B': {
      title: "Pression différentielle FAP trop élevée",
      severity: 'critical',
      confidence: 98,
      description: "🚨 FAP COMPLÈTEMENT BOUCHÉ ! Risque de panne immédiate.",
      emergency: true,
      causes: [
        { cause: "FAP totalement colmaté", probability: 90, solution: "emergency_intervention" },
        { cause: "Capteur défectueux", probability: 10, solution: "sensor_verification" }
      ],
      next_step: 'p244b_emergency_protocol'
    }
  },

  // Protocoles de solutions FAP
  fap_solution_protocols: {
    'emergency_fap_regeneration_protocol': {
      title: "🛣️ PROTOCOLE RÉGÉNÉRATION D'URGENCE",
      type: 'self_service',
      steps: [
        "1. 🔍 Vérifiez : minimum 1/4 de réservoir + huile OK",
        "2. 🛣️ Autoroute/route : 90+ km/h pendant 45 minutes MINIMUM",
        "3. ⚡ Maintenez 3000+ tours/min si possible",
        "4. 🚫 NE VOUS ARRÊTEZ PAS pendant la régénération",
        "5. 👀 Observez : fumée blanche = régénération en cours",
        "6. ✅ Continuez jusqu'à disparition complète des symptômes"
      ],
      warning: "⚠️ Si AUCUNE amélioration après 1h d'autoroute : ARRÊTEZ et appelez-nous !",
      success_rate: 70,
      cta: {
        type: 'urgent_self_service',
        followup_required: true,
        phone_support: true
      }
    },

    'urgent_fap_professional_cleaning': {
      title: "🔧 NETTOYAGE FAP PROFESSIONNEL URGENT",
      type: 'professional_service',
      reason: "Votre FAP est trop colmaté pour une régénération standard.",
      services: [
        {
          name: 'Nettoyage FAP Re-Fap Express',
          duration: '2h',
          success_rate: 95,
          warranty: '6 mois',
          urgency: 'same_day'
        },
        {
          name: 'Diagnostic complet + Nettoyage',
          duration: '3h',
          success_rate: 98,
          warranty: '12 mois',
          urgency: 'within_24h'
        }
      ],
      cta: {
        type: 'urgent_appointment',
        same_day_available: true
      }
    },

    'p244b_emergency_protocol': {
      title: "🚨 PROTOCOLE D'URGENCE CRITIQUE",
      type: 'emergency',
      immediate_actions: [
        "🚗 LIMITEZ la conduite au strict minimum",
        "📞 APPELEZ notre atelier IMMÉDIATEMENT",
        "🚫 N'essayez AUCUNE régénération",
        "🛑 Si mode dégradé activé : ARRÊTEZ-VOUS EN SÉCURITÉ"
      ],
      risk: "Risque de dommages moteur irréversibles",
      intervention: "Intervention professionnelle OBLIGATOIRE",
      cta: {
        type: 'emergency_call',
        priority: 'critical'
      }
    }
  }
};

// ==================== AUTRES CAS NON-FAP ====================
const OTHER_ISSUES_DATABASE = [
  {
    id: 'TURBO001',
    keywords: ['turbo', 'siffle', 'sifflement', 'suralimentation'],
    symptomes: 'Turbo qui siffle fort',
    causes_probables: 'Turbine en début de jeu, durites percées',
    solution: 'Contrôle visuel + test pression turbo',
    confidence: 0.8
  },
  {
    id: 'EGR001', 
    keywords: ['egr', 'vanne', 'prechauffage', 'clignote'],
    symptomes: 'Voyant préchauffage qui clignote',
    causes_probables: 'Vanne EGR encrassée, capteur position défaillant',
    solution: 'Nettoyage ou remplacement vanne EGR',
    confidence: 0.8
  },
  {
    id: 'ADBLUE001',
    keywords: ['adblue', 'decompte', 'kilometrage', 'uree'],
    symptomes: 'Voyant AdBlue avec décompte',
    causes_probables: 'Qualité AdBlue douteuse, réservoir mal rempli',
    solution: 'Vidange AdBlue + remplissage certifié',
    confidence: 0.9
  }
];

// ==================== MOTEUR CONVERSATIONNEL ====================
class ConversationalFAPEngine {
  constructor() {
    this.fapDB = FAP_CONVERSATION_DATABASE;
    this.otherDB = OTHER_ISSUES_DATABASE;
  }

  async processMessage(userMessage, conversationState = null) {
    console.log(`💬 Message: "${userMessage}"`);

    // Nouveau utilisateur ou conversation terminée
    if (!conversationState || conversationState.step === 'completed') {
      return this.initializeConversation(userMessage);
    }

    // Continuer la conversation FAP en cours
    if (conversationState.category === 'fap') {
      return this.continueFAPConversation(userMessage, conversationState);
    }

    // Fallback général
    return this.handleGeneralQuery(userMessage);
  }

  initializeConversation(userMessage) {
    const isFAPRelated = this.isFAPRelated(userMessage);
    
    if (isFAPRelated) {
      console.log('🔧 Détection problème FAP -> Mode conversationnel');
      return {
        message: this.fapDB.conversation_steps.fap_symptom_detection.message,
        type: 'fap_conversation',
        source: 'fap_expert',
        conversationState: {
          step: 'fap_symptom_detection',
          category: 'fap',
          collectedData: { initial_query: userMessage },
          confidence: 0
        }
      };
    } else {
      console.log('🔍 Problème non-FAP -> Recherche base générale');
      return this.handleNonFAPIssue(userMessage);
    }
  }

  isFAPRelated(message) {
    const fapKeywords = this.fapDB.conversation_steps.welcome.fap_keywords;
    const messageLower = message.toLowerCase();
    
    return fapKeywords.some(keyword => messageLower.includes(keyword)) ||
           /P2[0-4][0-9A-F]{2}/i.test(message); // Codes FAP
  }

  continueFAPConversation(userMessage, conversationState) {
    const currentStep = conversationState.step;
    const stepData = this.fapDB.conversation_steps[currentStep];
    
    if (!stepData) {
      console.error(`❌ Étape inconnue: ${currentStep}`);
      return this.handleGeneralQuery(userMessage);
    }

    // Analyser la réponse utilisateur
    const userResponse = this.parseUserResponse(userMessage, stepData);
    
    // Mettre à jour les données collectées
    conversationState.collectedData[currentStep] = userResponse;
    
    // Déterminer la prochaine étape
    const nextStep = this.determineNextFAPStep(userResponse, stepData, conversationState);
    
    // Vérifier si on peut faire un diagnostic
    if (this.canProvideFAPDiagnosis(conversationState)) {
      return this.generateFAPDiagnosis(conversationState);
    }
    
    // Continuer la conversation
    const nextStepData = this.fapDB.conversation_steps[nextStep];
    conversationState.step = nextStep;
    conversationState.confidence = this.calculateFAPConfidence(conversationState.collectedData);
    
    return {
      message: nextStepData.message,
      type: 'fap_conversation',
      source: 'fap_expert',
      confidence: conversationState.confidence,
      conversationState: conversationState,
      options: nextStepData.options
    };
  }

  parseUserResponse(message, stepData) {
    const messageLower = message.toLowerCase();
    
    if (stepData.type === 'yes_no') {
      if (messageLower.includes('oui') || messageLower.includes('yes')) return 'oui';
      if (messageLower.includes('non') || messageLower.includes('no')) return 'non';
      if (messageLower.includes('sais pas') || messageLower.includes('know')) return 'ne_sais_pas';
    }
    
    if (stepData.validation) {
      const matches = message.match(stepData.validation);
      if (matches) return matches;
    }
    
    // Recherche dans les options multiples
    if (stepData.options) {
      for (const [key, value] of Object.entries(stepData.options)) {
        if (messageLower.includes(key.toLowerCase())) return key;
      }
    }
    
    return message; // Retour brut si pas de correspondance
  }

  determineNextFAPStep(userResponse, stepData, conversationState) {
    if (stepData.options && stepData.options[userResponse]) {
      return stepData.options[userResponse];
    }
    
    // Logique spéciale pour les codes d'erreur
    if (Array.isArray(userResponse)) {
      const errorCode = userResponse[0];
      if (this.fapDB.fap_error_codes[errorCode]) {
        conversationState.detectedCode = errorCode;
        return this.fapDB.fap_error_codes[errorCode].next_step;
      }
    }
    
    // Par défaut, passer à l'analyse de conduite
    return 'fap_driving_analysis';
  }

  generateFAPDiagnosis(conversationState) {
    const { collectedData, detectedCode } = conversationState;
    let diagnosis = "🔧 **Diagnostic FAP Re-Fap**\n\n";
    let confidence = this.calculateFAPConfidence(collectedData);
    let ctas = [];

    // Diagnostic basé sur le code d'erreur
    if (detectedCode && this.fapDB.fap_error_codes[detectedCode]) {
      const codeData = this.fapDB.fap_error_codes[detectedCode];
      diagnosis += `**Code détecté :** ${detectedCode} - ${codeData.title}\n\n`;
      diagnosis += `**Description :** ${codeData.description}\n\n`;
      
      // Cause la plus probable
      const mainCause = codeData.causes.reduce((prev, current) => 
        prev.probability > current.probability ? prev : current
      );
      
      diagnosis += `**Cause principale (${mainCause.probability}%) :** ${mainCause.cause}\n\n`;
      
      // Solution recommandée
      const protocol = this.fapDB.fap_solution_protocols[mainCause.solution];
      if (protocol) {
        diagnosis += `**Solution recommandée :** ${protocol.title}\n\n`;
        if (protocol.steps) {
          diagnosis += protocol.steps.join('\n') + '\n\n';
        }
        if (protocol.warning) {
          diagnosis += `⚠️ ${protocol.warning}\n\n`;
        }
      }

      // CTA selon l'urgence
      if (codeData.emergency || codeData.urgency === 'immediate') {
        ctas.push({
          type: 'emergency',
          text: '🚨 Intervention urgente',
          action: 'emergency_call'
        });
      } else if (protocol?.type === 'self_service') {
        ctas.push({
          type: 'self_service',
          text: '🛣️ Essayer la régénération autoroute',
          action: 'highway_regeneration'
        });
      }
      
      ctas.push({
        type: 'professional',
        text: '🔧 Nettoyage FAP professionnel',
        action: 'book_cleaning'
      });
    }

    // Diagnostic basé sur les symptômes uniquement
    else {
      diagnosis += "**Analyse basée sur vos symptômes :**\n\n";
      
      if (collectedData.fap_symptom_detection === 'oui') {
        diagnosis += "✅ Voyant FAP allumé\n";
      }
      if (collectedData.fap_physical_symptoms === 'oui') {
        diagnosis += "✅ Perte de puissance confirmée\n";
      }
      if (collectedData.urban_fap_issue) {
        diagnosis += "⚠️ Conduite urbaine problématique pour le FAP\n\n";
        diagnosis += "**Recommandation :** Votre FAP a besoin de régénération urgente.\n\n";
        
        ctas.push({
          type: 'education',
          text: '📚 Comprendre la régénération FAP',
          action: 'learn_regeneration'
        });
      }
    }

    return {
      message: diagnosis,
      source: 'fap_expert',
      confidence: confidence,
      ctas: ctas,
      type: 'fap_diagnosis',
      conversationState: { ...conversationState, step: 'completed' }
    };
  }

  handleNonFAPIssue(userMessage) {
    console.log('🔍 Recherche dans base autres problèmes...');
    
    const messageLower = userMessage.toLowerCase();
    const matchingIssue = this.otherDB.find(issue => 
      issue.keywords.some(keyword => messageLower.includes(keyword))
    );

    if (matchingIssue) {
      console.log(`✅ Problème trouvé: ${matchingIssue.id}`);
      return {
        message: `🔧 **${matchingIssue.symptomes}**\n\n🔍 **Causes probables :** ${matchingIssue.causes_probables}\n\n✅ **Solution :** ${matchingIssue.solution}`,
        source: 'database',
        confidence: matchingIssue.confidence,
        ctas: [
          {
            type: 'diagnostic',
            text: '🔍 Diagnostic en atelier',
            action: 'book_diagnostic'
          }
        ]
      };
    }

    console.log('🤖 Fallback vers Claude...');
    return this.handleGeneralQuery(userMessage);
  }

  async handleGeneralQuery(userMessage) {
    // Fallback vers Claude pour les cas non couverts
    const aiResponse = await this.getClaudeResponse(userMessage);
    
    return {
      message: aiResponse || "Désolé, je ne peux pas analyser ce problème spécifique. Pouvez-vous me donner plus de détails ou me parler d'un problème de FAP ?",
      source: 'AI',
      confidence: 0.7,
      ctas: [
        {
          type: 'contact',
          text: '📞 Parler à un expert',
          action: 'contact_expert'
        }
      ]
    };
  }

  async getClaudeResponse(message) {
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
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `Tu es Julien, expert automobile spécialisé FAP Re-Fap. Question: ${message}`
          }]
        })
      });

      const data = await response.json();
      return data.content?.[0]?.text;
    } catch (error) {
      console.error('❌ Erreur Claude:', error);
      return null;
    }
  }

  calculateFAPConfidence(collectedData) {
    let confidence = 0;
    let dataPoints = 0;

    Object.keys(collectedData).forEach(key => {
      if (collectedData[key] && key !== 'initial_query') {
        dataPoints++;
        if (key === 'detectedCode') confidence += 0.4;
        else if (key.includes('symptom')) confidence += 0.2;
        else confidence += 0.1;
      }
    });

    return Math.min(confidence, 0.95);
  }

  canProvideFAPDiagnosis(conversationState) {
    const { collectedData, detectedCode } = conversationState;
    
    // Si code d'erreur détecté = diagnostic immédiat
    if (detectedCode) return true;
    
    // Si assez de données collectées
    const keyData = ['fap_symptom_detection', 'fap_physical_symptoms', 'fap_driving_analysis'];
    const collectedKeyData = keyData.filter(key => collectedData[key]).length;
    
    return collectedKeyData >= 2;
  }
}

// ==================== ROUTES ====================
const fapEngine = new ConversationalFAPEngine();

// Sessions de conversation (en mémoire pour la démo)
const conversationSessions = new Map();

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Récupérer ou créer session
    const conversationState = conversationSessions.get(sessionId);
    
    // Traiter le message
    const result = await fapEngine.processMessage(message, conversationState);
    
    // Sauvegarder l'état de conversation
    if (result.conversationState) {
      conversationSessions.set(sessionId, result.conversationState);
    }
    
    res.json({
      success: true,
      ...result,
      sessionId: sessionId,
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

// Route de test FAP
app.get('/api/test-fap/:query', async (req, res) => {
  try {
    const result = await fapEngine.processMessage(req.params.query);
    res.json({
      query: req.params.query,
      result: result,
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
      fap_expert: 'Conversationnel intégré',
      other_issues: `${OTHER_ISSUES_DATABASE.length} cas`,
      claude: CLAUDE_API_KEY ? 'Configuré' : 'Manquant',
      openai: OPENAI_API_KEY ? 'Configuré' : 'Manquant'
    },
    version: 'FAP Re-Fap Conversationnel Expert',
    conversation_steps: Object.keys(FAP_CONVERSATION_DATABASE.conversation_steps).length,
    error_codes: Object.keys(FAP_CONVERSATION_DATABASE.fap_error_codes).length
  });
});

// Reset session
app.post('/api/reset-session', (req, res) => {
  const { sessionId = 'default' } = req.body;
  conversationSessions.delete(sessionId);
  res.json({ success: true, message: 'Session réinitialisée' });
});

// Servir le fichier HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Serveur FAP Re-Fap conversationnel démarré sur le port ${port}`);
  console.log(`🔧 Expert FAP: ${Object.keys(FAP_CONVERSATION_DATABASE.conversation_steps).length} étapes conversationnelles`);
  console.log(`📊 Autres cas: ${OTHER_ISSUES_DATABASE.length} problèmes couverts`);
  console.log(`🤖 Fallback: Claude API ${CLAUDE_API_KEY ? '✅' : '❌'}`);
  console.log(`🔍 Test: http://localhost:${port}/api/test-fap/voyant%20fap%20allume`);
});
