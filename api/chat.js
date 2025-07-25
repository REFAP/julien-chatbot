// api/chat.js
// Chat API avec système de récompense intégré

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, isPremium = false, userData = {}, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // NOUVEAU: Système de récompense intégré
    const rewardSystem = analyzeUserForRewards(userData, message);

    // Réponse selon le niveau utilisateur
    const response = generateResponseWithRewards(message, rewardSystem);

    return res.status(200).json({
      success: true,
      message: response.message,
      
      // Données existantes (compatibilité)
      strategy: response.strategy || "standard_simulation",
      aiMood: rewardSystem.level > 0 ? "enhanced_simulation" : "standard_simulation", 
      score: rewardSystem.leadValue / 10, // Convertit en score sur 10
      timestamp: new Date().toISOString(),
      isPremium: rewardSystem.level > 0,

      // NOUVEAU: Système de récompense
      rewardSystem: {
        userLevel: rewardSystem.level,
        levelName: rewardSystem.levelName,
        conversionStrategy: rewardSystem.conversionStrategy,
        uiConfig: rewardSystem.uiConfig,
        leadValue: rewardSystem.leadValue,
        partner: rewardSystem.partner
      }
    });

  } catch (error) {
    console.error('Erreur chat API:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Fonctions du système de récompense intégrées
function analyzeUserForRewards(userData, message) {
  // Détection niveau utilisateur
  let level = 0;
  if (userData.email) level = 1;
  if (userData.phone) level = 2; 
  if (userData.vehicleModel && userData.location) level = 3;

  // Détection type de question
  const questionType = detectQuestionType(message);
  
  // Calcul valeur lead
  const baseValues = { 'engine': 35, 'brakes': 40, 'transmission': 45, 'general': 25 };
  const multipliers = [0, 1, 1.8, 2.5];
  const leadValue = Math.round((baseValues[questionType] || 25) * (multipliers[level] || 1));

  // Stratégie de conversion
  const conversionStrategy = getConversionStrategy(level, questionType);
  
  // Configuration UI
  const uiConfig = generateUIConfig(level, conversionStrategy);

  return {
    level,
    levelName: getLevelName(level),
    questionType,
    leadValue,
    partner: getOptimalPartner(questionType, leadValue),
    conversionStrategy,
    uiConfig
  };
}

function generateResponseWithRewards(message, rewardSystem) {
  const { level, questionType, conversionStrategy } = rewardSystem;

  // Réponses selon le niveau
  const baseResponses = {
    0: `**Diagnostic de base** pour votre problème${questionType === 'brakes' ? ' de freinage' : questionType === 'engine' ? ' moteur' : ''}.\n\nD'après mon analyse initiale, ${getBasicDiagnosis(questionType)}.`,
    
    1: `**Diagnostic avancé** de votre ${questionType}.\n\nAnalyse approfondie terminée : ${getAdvancedDiagnosis(questionType)}. Estimation des coûts disponible.`,
    
    2: `**Expertise premium** de votre problème.\n\nDiagnostic complet effectué. Expert partenaire contacté pour devis personnalisé.`,
    
    3: `**Service VIP activé** - Diagnostic prédictif personnalisé.\n\nAnalyse complète avec prédictions d'entretien et optimisation des coûts. Suivi automatique activé.`
  };

  let response = baseResponses[level] || baseResponses[0];

  // Ajout de la stratégie de conversion si applicable
  if (conversionStrategy) {
    response += `\n\n---\n\n${conversionStrategy.trigger}`;
  }

  return {
    message: response,
    strategy: level > 0 ? "enhanced_simulation" : "standard_simulation"
  };
}

function detectQuestionType(message) {
  const messageLower = message.toLowerCase();
  if (messageLower.includes('frein') || messageLower.includes('freinage')) return 'brakes';
  if (messageLower.includes('moteur') || messageLower.includes('voyant')) return 'engine';
  if (messageLower.includes('boite') || messageLower.includes('vitesse')) return 'transmission';
  return 'general';
}

function getConversionStrategy(level, questionType) {
  const strategies = {
    0: {
      trigger: `🔓 **Diagnostic ${questionType === 'brakes' ? 'freinage' : 'moteur'} complet disponible !**\n\nD'après mon analyse, votre problème nécessite un diagnostic approfondi. Mes algorithmes avancés peuvent analyser 47 points de contrôle supplémentaires.\n\n💎 **Valeur : 50€ d'expertise gratuite**\nIl vous suffit de laisser votre email pour débloquer le rapport complet.`,
      required: ['email', 'firstName', 'location'],
      reward: 'diagnostic premium avec estimation coûts'
    },
    
    1: {
      trigger: `📞 **Expertise maximale disponible !**\n\nNos partenaires experts peuvent vous rappeler dans l'heure pour un devis personnalisé précis.\n\n💎 **Service habituellement facturé 80€ - GRATUIT pour vous**`,
      required: ['phone', 'vehicleModel', 'urgency'],
      reward: 'mise en relation directe avec garage partenaire'
    },
    
    2: {
      trigger: `🏆 **Service VIP - Diagnostic prédictif !**\n\nAvec l'historique complet de votre véhicule, notre IA peut prédire les prochaines pannes.\n\n🎁 **Service premium exclusif - Accès VIP à vie**`,
      required: ['vehicleYear', 'mileage'],
      reward: 'diagnostic prédictif et suivi personnalisé'
    }
  };
  
  return strategies[level] || null;
}

function generateUIConfig(level, strategy) {
  if (!strategy) return null;
  
  const configs = {
    0: {
      title: "🔓 Diagnostic Premium Gratuit",
      subtitle: "50€ d'expertise gratuite",
      fields: [
        { name: 'email', type: 'email', placeholder: 'votre@email.com', required: true },
        { name: 'firstName', type: 'text', placeholder: 'Votre prénom', required: true },
        { name: 'location', type: 'text', placeholder: 'Votre ville', required: true }
      ],
      button: 'OBTENIR MON DIAGNOSTIC PREMIUM'
    },
    1: {
      title: "📞 Expertise Personnalisée",
      subtitle: "Un expert vous rappelle sous 1h", 
      fields: [
        { name: 'phone', type: 'tel', placeholder: '06 12 34 56 78', required: true },
        { name: 'vehicleModel', type: 'text', placeholder: 'Ex: Peugeot 308', required: true },
        { name: 'urgency', type: 'select', options: ['Immédiat', 'Cette semaine', 'Ce mois'], required: true }
      ],
      button: 'ACCÉDER À L\'EXPERTISE MAXIMALE'
    },
    2: {
      title: "🏆 Service VIP",
      subtitle: "Suivi personnalisé à vie",
      fields: [
        { name: 'vehicleYear', type: 'number', placeholder: '2018', required: true },
        { name: 'mileage', type: 'number', placeholder: '85000 km', required: true }
      ],
      button: 'ACTIVER LE SERVICE VIP'
    }
  };
  
  return configs[level];
}

function getLevelName(level) {
  const names = {
    0: 'Diagnostic de Base',
    1: 'Diagnostic Avancé',
    2: 'Expertise Premium', 
    3: 'Service VIP'
  };
  return names[level] || 'Inconnu';
}

function getOptimalPartner(questionType, leadValue) {
  if (questionType === 'brakes' && leadValue <= 40) return 'MIDAS';
  if (questionType === 'engine' && leadValue >= 35) return 'IDGARAGES';
  return 'MIDAS';
}

function getBasicDiagnosis(questionType) {
  const diagnoses = {
    'brakes': 'les freins nécessitent une vérification urgente. Bruit suspect détecté',
    'engine': 'le moteur présente des symptômes à analyser. Possible problème EGR/FAP', 
    'transmission': 'la boîte de vitesses demande attention',
    'general': 'votre véhicule nécessite un diagnostic approfondi'
  };
  return diagnoses[questionType] || diagnoses.general;
}

function getAdvancedDiagnosis(questionType) {
  const diagnoses = {
    'brakes': 'système de freinage à contrôler en priorité. Plaquettes probablement usées',
    'engine': 'problème moteur identifié avec précision. Intervention rapide recommandée',
    'transmission': 'dysfonctionnement boîte détecté. Révision nécessaire',
    'general': 'analyse complète effectuée avec recommandations ciblées'
  };
  return diagnoses[questionType] || diagnoses.general;
}
