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
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// ==================== BASE FAP EXPERTE SIMPLE ====================
const FAP_EXPERT_DATABASE = [
  {
    id: 'FAP001',
    triggers: ['voyant', 'moteur', 'puissance', 'perte'],
    symptoms: 'Voyant moteur + perte de puissance',
    question: "Avez-vous des codes d'erreur comme P2002, P2463, P244A ?",
    responses: {
      'P2002': {
        diagnosis: "🔧 **Code P2002 - FAP colmaté**\n\n**Cause :** Filtre à particules saturé en suie\n**Solution :** Nettoyage FAP professionnel ou régénération forcée",
        ctas: [
          { type: 'professional', text: '🔧 Nettoyage FAP Re-Fap', action: 'book_cleaning' },
          { type: 'self_service', text: '🛣️ Tentative régénération autoroute', action: 'highway_regen' }
        ]
      },
      'P2463': {
        diagnosis: "🚨 **Code P2463 - Suie excessive**\n\n**Cause :** Accumulation critique de suie\n**Solution :** Intervention professionnelle URGENTE",
        ctas: [
          { type: 'emergency', text: '🚨 Intervention urgente', action: 'emergency_call' }
        ]
      },
      'aucun': {
        diagnosis: "🔍 **Sans code d'erreur**\n\nQuel est votre type de conduite principalement ?",
        follow_up: 'driving_pattern'
      }
    }
  },
  {
    id: 'FAP002',
    triggers: ['fumée', 'noire', 'echappement'],
    symptoms: 'Fumée noire à l\'échappement',
    diagnosis: "🔧 **Fumée noire = FAP colmaté**\n\n**Explication :** Combustion incomplète due au FAP saturé\n**Action :** Nettoyage professionnel recommandé",
    ctas: [
      { type: 'professional', text: '🔧 Diagnostic + Nettoyage FAP', action: 'book_service' }
    ]
  },
  {
    id: 'FAP003',
    triggers: ['urbain', 'ville', 'court', 'trajet'],
    symptoms: 'Conduite urbaine exclusive',
    diagnosis: "🚨 **Conduite urbaine = Problème FAP**\n\n**Pourquoi :** Le FAP a besoin de 600°C pendant 20+ minutes pour se régénérer. Impossible en ville !\n\n**Solution immédiate :** Trajet autoroute 30+ km à 90+ km/h",
    ctas: [
      { type: 'education', text: '📚 Guide régénération FAP', action: 'learn_regen' },
      { type: 'professional', text: '🔧 Nettoyage si échec', action: 'book_cleaning' }
    ]
  }
];

// Autres problèmes non-FAP
const OTHER_ISSUES_DB = [
  {
    id: 'TURBO001',
    triggers: ['turbo', 'siffle', 'sifflement'],
    diagnosis: "🔧 **Turbo qui siffle**\n\nCause probable : Turbine usée ou fuite durite\nAction : Contrôle pression turbo",
    ctas: [{ type: 'diagnostic', text: '🔍 Diagnostic turbo', action: 'turbo_check' }]
  },
  {
    id: 'EGR001',
    triggers: ['egr', 'vanne', 'prechauffage'],
    diagnosis: "🔧 **Problème EGR/Préchauffage**\n\nCause probable : Vanne EGR encrassée\nAction : Nettoyage vanne EGR",
    ctas: [{ type: 'service', text: '🔧 Service EGR', action: 'egr_service' }]
  }
];

// ==================== MOTEUR SIMPLE ET ROBUSTE ====================
class SimpleFAPExpert {
  constructor() {
    this.fapDB = FAP_EXPERT_DATABASE;
    this.otherDB = OTHER_ISSUES_DB;
  }

  async processMessage(userMessage, step = 'initial') {
    const messageLower = userMessage.toLowerCase();
    console.log(`💬 Analyse: "${userMessage}" (étape: ${step})`);

    // Étape 1: Détection du problème
    if (step === 'initial') {
      return this.detectIssueType(messageLower);
    }

    // Étape 2: Questions de suivi FAP
    if (step === 'fap_followup') {
      return this.handleFAPFollowup(messageLower);
    }

    // Étape 3: Pattern de conduite
    if (step === 'driving_pattern') {
      return this.analyzeDrivingPattern(messageLower);
    }

    // Fallback
    return this.handleUnknownIssue(userMessage);
  }

  detectIssueType(messageLower) {
    // Recherche FAP en priorité
    for (const fapCase of this.fapDB) {
      const matchCount = fapCase.triggers.filter(trigger => 
        messageLower.includes(trigger)
      ).length;

      if (matchCount >= 2) {
        console.log(`✅ FAP détecté: ${fapCase.id} (${matchCount} triggers)`);
        
        if (fapCase.question) {
          return {
            message: `🔧 **Problème FAP détecté !**\n\n${fapCase.symptoms}\n\n${fapCase.question}`,
            source: 'fap_expert',
            nextStep: 'fap_followup',
            caseId: fapCase.id
          };
        } else {
          return {
            message: fapCase.diagnosis,
            source: 'fap_expert',
            ctas: fapCase.ctas || []
          };
        }
      }
    }

    // Recherche autres problèmes
    for (const issue of this.otherDB) {
      const hasMatch = issue.triggers.some(trigger => 
        messageLower.includes(trigger)
      );

      if (hasMatch) {
        console.log(`✅ Autre problème: ${issue.id}`);
        return {
          message: issue.diagnosis,
          source: 'expert_database',
          ctas: issue.ctas || []
        };
      }
    }

    // Pas de correspondance -> Questions générales
    return this.askGeneralQuestions();
  }

  handleFAPFollowup(messageLower) {
    // Détection codes d'erreur
    const errorCodes = messageLower.match(/P[0-9A-F]{4}/gi);
    
    if (errorCodes && errorCodes.length > 0) {
      const code = errorCodes[0].toUpperCase();
      const fapCase = this.fapDB.find(f => f.responses && f.responses[code]);
      
      if (fapCase && fapCase.responses[code]) {
        const response = fapCase.responses[code];
        return {
          message: response.diagnosis,
          source: 'fap_expert',
          ctas: response.ctas || [],
          confidence: 0.9
        };
      }
    }

    // Pas de code -> Analyser conduite
    if (messageLower.includes('aucun') || messageLower.includes('pas') || messageLower.includes('non')) {
      return {
        message: "D'accord, pas de code d'erreur. Quel est votre type de conduite ?\n\n• Principalement en ville (trajets < 20 min)\n• Mixte ville/route\n• Principalement autoroute/longs trajets",
        source: 'fap_expert',
        nextStep: 'driving_pattern'
      };
    }

    return this.askGeneralQuestions();
  }

  analyzeDrivingPattern(messageLower) {
    if (messageLower.includes('ville') || messageLower.includes('urbain') || messageLower.includes('court')) {
      const urbanCase = this.fapDB.find(f => f.id === 'FAP003');
      return {
        message: urbanCase.diagnosis,
        source: 'fap_expert',
        ctas: urbanCase.ctas,
        confidence: 0.85
      };
    }

    if (messageLower.includes('mixte')) {
      return {
        message: "🔧 **Conduite mixte**\n\nVotre FAP se régénère parfois mais pas assez.\n\n**Recommandation :** Augmentez la fréquence des longs trajets (30+ km d'affilée)",
        source: 'fap_expert',
        ctas: [
          { type: 'education', text: '📚 Guide conduite FAP', action: 'driving_guide' },
          { type: 'professional', text: '🔧 Nettoyage préventif', action: 'preventive_cleaning' }
        ]
      };
    }

    if (messageLower.includes('autoroute') || messageLower.includes('long')) {
      return {
        message: "🤔 **Conduite favorable au FAP**\n\nMalgré vos longs trajets, le problème persiste.\n\n**Analyse :** Possible défaillance capteur ou FAP très encrassé",
        source: 'fap_expert',
        ctas: [
          { type: 'professional', text: '🔍 Diagnostic approfondi', action: 'deep_diagnostic' }
        ]
      };
    }

    return this.askGeneralQuestions();
  }

  askGeneralQuestions() {
    return {
      message: "Pour mieux vous aider, pouvez-vous me dire :\n\n• Quels voyants sont allumés ?\n• Ressentez-vous une perte de puissance ?\n• Y a-t-il de la fumée à l'échappement ?\n• Quel type de conduite faites-vous ?",
      source: 'fap_expert',
      nextStep: 'initial'
    };
  }

  async handleUnknownIssue(userMessage) {
    console.log('🤖 Fallback vers Claude...');
    
    const aiResponse = await this.getClaudeResponse(userMessage);
    
    return {
      message: aiResponse || "Je ne peux pas analyser ce problème spécifique. Pour les problèmes de FAP, décrivez-moi vos symptômes (voyants, perte de puissance, fumée, etc.)",
      source: 'AI',
      ctas: [
        { type: 'contact', text: '📞 Parler à un expert', action: 'contact_expert' }
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
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Tu es Julien, expert FAP Re-Fap. Réponds brièvement à cette question automobile: ${message}`
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
}

// ==================== ROUTES SIMPLES ====================
const fapExpert = new SimpleFAPExpert();

// Sessions simples en mémoire
const sessions = new Map();

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Récupérer l'état de session
    const sessionData = sessions.get(sessionId) || { step: 'initial' };
    
    // Traiter le message
    const result = await fapExpert.processMessage(message, sessionData.step);
    
    // Sauvegarder l'état
    if (result.nextStep) {
      sessions.set(sessionId, { 
        step: result.nextStep,
        caseId: result.caseId,
        lastMessage: message 
      });
    }
    
    res.json({
      success: true,
      response: result.message,
      source: result.source,
      confidence: result.confidence || 0.8,
      ctas: result.ctas || [],
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

// Reset session
app.post('/api/reset', (req, res) => {
  const { sessionId = 'default' } = req.body;
  sessions.delete(sessionId);
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      fap_expert: `${FAP_EXPERT_DATABASE.length} cas FAP`,
      other_issues: `${OTHER_ISSUES_DB.length} autres cas`,
      claude: CLAUDE_API_KEY ? 'Configuré' : 'Manquant'
    },
    version: 'FAP Expert Simple & Robuste'
  });
});

// Interface HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 FAP Expert Simple démarré sur le port ${port}`);
  console.log(`🔧 ${FAP_EXPERT_DATABASE.length} cas FAP + ${OTHER_ISSUES_DB.length} autres cas`);
  console.log(`🤖 Claude API: ${CLAUDE_API_KEY ? '✅' : '❌'}`);
});
