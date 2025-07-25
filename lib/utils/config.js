// lib/utils/config.js
// Configuration du système Dual Brain + Lead Generation pour partenaires auto

export const config = {
  // APIs Configuration - Dual Brain System
  apis: {
    claude: {
      apiKey: process.env.CLAUDE_API_KEY,
      model: 'claude-3-sonnet-20240229',
      maxTokens: 1000,
      temperature: 0.7
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.7
    }
  },

  // Stratégies de fusion Dual Brain
  mergeStrategy: {
    mode: 'intelligent',
    timeout: 10000,
    fallbackToSingle: true
  },

  // 🎯 BUSINESS MODEL - Lead Generation
  leadGeneration: {
    // Seuil pour déclencher la collecte de données
    qualityThreshold: 0.7, // Si confiance IA > 70%, proposer l'upgrade premium
    
    // Questions qui déclenchent la collecte de leads auto
    autoTriggers: [
      'garage', 'réparation', 'entretien', 'voiture', 'auto', 'mécanique',
      'pneu', 'freins', 'vidange', 'révision', 'panne', 'diagnostic',
      'pièce détachée', 'carrosserie', 'vendre', 'acheter', 'occasion'
    ],

    // Données minimum requises pour l'accès premium
    requiredData: [
      'email', 'nom', 'ville', 'besoin_auto'
    ]
  },

  // 🤝 PARTENAIRES - Configuration
  partners: {
    midas: {
      name: 'MIDAS',
      specialites: ['entretien', 'freins', 'pneu', 'vidange', 'révision'],
      leadValue: 25, // €25 par lead qualifié
      webhook: process.env.MIDAS_WEBHOOK_URL,
      active: true
    },
    idgarages: {
      name: 'IDGARAGES',
      specialites: ['réparation', 'diagnostic', 'mécanique', 'panne'],
      leadValue: 30,
      webhook: process.env.IDGARAGES_WEBHOOK_URL,
      active: true
    },
    carterCash: {
      name: 'CARTER-CASH',
      specialites: ['pièce détachée', 'accessoire', 'équipement'],
      leadValue: 20,
      webhook: process.env.CARTER_WEBHOOK_URL,
      active: true
    },
    yakarouler: {
      name: 'YAKAROULER',
      specialites: ['occasion', 'vente', 'achat', 'financement'],
      leadValue: 50, // Plus élevé car achat véhicule
      webhook: process.env.YAKAROULER_WEBHOOK_URL,
      active: true
    }
  },

  // 💰 SYSTÈME DE SCORING DES LEADS
  leadScoring: {
    weights: {
      urgence: 0.3,        // "urgent", "rapidement", "aujourd'hui"
      budget: 0.25,        // Mention de budget
      localisation: 0.2,   // Ville renseignée
      contact: 0.25        // Téléphone donné
    },
    
    // Critères d'urgence
    urgencyKeywords: [
      'urgent', 'rapidement', 'aujourd\'hui', 'demain', 'cette semaine',
      'panne', 'ne démarre plus', 'problème grave', 'accident'
    ],
    
    // Critères de budget
    budgetKeywords: [
      'budget', 'prix', 'coût', 'combien', 'euros', '€', 'financ'
    ]
  },

  // 🎁 SYSTÈME DE RÉCOMPENSES
  premiumAccess: {
    // Message d'accroche pour l'upgrade premium
    upgradeMessage: {
      intro: "🚀 Impressionnant ! Votre question mérite une réponse d'expert premium.",
      offer: "Accédez gratuitement à notre IA double-puissance (fusion Claude + ChatGPT) en échange de quelques infos qui nous aident à vous accompagner.",
      benefits: [
        "✨ Réponses 2x plus précises et créatives",
        "🎯 Conseils personnalisés selon votre profil",
        "🔥 Accès prioritaire à nos nouveaux outils"
      ]
    },
    
    // Durée d'accès gratuit après données
    freeAccessDuration: 30 * 24 * 60 * 60 * 1000, // 30 jours en ms
  },

  // 🔒 PROTECTION DES DONNÉES
  privacy: {
    dataRetention: 365, // jours
    anonymization: true,
    gdprCompliant: true,
    optOutAvailable: true
  },

  // Rate limiting
  rateLimits: {
    standard: 5,    // 5 requêtes/min pour users standards
    premium: 20,    // 20 requêtes/min pour users premium
    burstLimit: 10
  },

  // 📊 ANALYTICS & TRACKING
  analytics: {
    trackConversions: true,
    trackPartnerMatch: true,
    trackLeadQuality: true,
    webhookSecret: process.env.WEBHOOK_SECRET
  }
};

// Variables d'environnement requises
export const requiredEnvVars = [
  'CLAUDE_API_KEY',
  'OPENAI_API_KEY',
  'LEADS_SECRET_KEY',
  'WEBHOOK_SECRET'
];

// Variables optionnelles pour partenaires
export const optionalEnvVars = [
  'MIDAS_WEBHOOK_URL',
  'IDGARAGES_WEBHOOK_URL', 
  'CARTER_WEBHOOK_URL',
  'YAKAROULER_WEBHOOK_URL'
];

// Validation de la configuration
export function validateConfig() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Variables d'environnement manquantes: ${missing.join(', ')}`);
    console.log('💡 Le système fonctionnera en mode dégradé sans lead generation');
  }
  
  return missing.length === 0;
}

// Détection automatique du type de besoin selon la conversation
export function detectNeedType(conversation) {
  const text = conversation.toLowerCase();
  
  for (const [partner, config] of Object.entries(config.partners)) {
    for (const specialite of config.specialites) {
      if (text.includes(specialite)) {
        return {
          partner,
          specialite,
          confidence: 0.8
        };
      }
    }
  }
  
  return null;
}

// Calcul de la valeur du lead pour optimiser la distribution
export function calculateLeadValue(leadData, needType) {
  let baseValue = 0;
  
  if (needType && config.partners[needType.partner]) {
    baseValue = config.partners[needType.partner].leadValue;
  }
  
  // Bonus selon qualité des données
  const dataQuality = leadData.phone ? 1.5 : 1.0;
  const urgencyBonus = leadData.urgency ? 1.3 : 1.0;
  const budgetBonus = leadData.budget ? 1.2 : 1.0;
  
  return Math.round(baseValue * dataQuality * urgencyBonus * budgetBonus);
}

export default config;
