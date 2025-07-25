// api/reward-system.js
// API pour gérer le système de récompense progressif

import { ProgressiveRewardSystem } from '../lib/utils/rewardSystem.js';
import { AdvancedRateLimiter } from '../lib/middleware/rateLimiter.js';
import { DualBrainOrchestrator } from '../lib/ai/dual-brain.js';
import { LeadGenerationSystem } from '../lib/utils/leads.js';

const rewardSystem = new ProgressiveRewardSystem();
const rateLimiter = new AdvancedRateLimiter();
const dualBrain = new DualBrainOrchestrator();
const leadSystem = new LeadGenerationSystem();

export default async function handler(req, res) {
  // Rate limiting
  const rateLimitResult = await rateLimiter.checkLimit(req);
  if (rateLimitResult.limited) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: rateLimitResult.retryAfter
    });
  }

  if (req.method === 'POST') {
    return handleRewardInteraction(req, res);
  } else if (req.method === 'GET') {
    return handleGetUserStatus(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Gère une interaction avec le système de récompense
async function handleRewardInteraction(req, res) {
  try {
    const { 
      message, 
      userData = {}, 
      action, // 'analyze', 'collect_data', 'upgrade_request'
      sessionId 
    } = req.body;

    // Validation des données
    if (!message && action !== 'collect_data') {
      return res.status(400).json({ 
        error: 'Message requis pour l\'analyse' 
      });
    }

    const enrichedUserData = {
      ...userData,
      sessionId,
      timestamp: new Date().toISOString()
    };

    switch (action) {
      case 'analyze':
        return await handleAnalyzeWithRewards(message, enrichedUserData, res);
      
      case 'collect_data':
        return await handleDataCollection(enrichedUserData, res);
      
      case 'upgrade_request':
        return await handleUpgradeRequest(enrichedUserData, res);
      
      default:
        return await handleAnalyzeWithRewards(message, enrichedUserData, res);
    }

  } catch (error) {
    console.error('Erreur reward system:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Analyse avec système de récompense intégré
async function handleAnalyzeWithRewards(message, userData, res) {
  // Détection du type de question automobile
  const questionType = detectQuestionType(message);
  
  // Génération de la stratégie selon le niveau utilisateur
  const rewardResponse = rewardSystem.generateLeveledResponse(
    message, 
    userData, 
    questionType
  );

  // Appel à l'IA selon le niveau de détail autorisé
  const aiResponse = await dualBrain.processQuery({
    message,
    aiMode: rewardResponse.aiMode,
    detailLevel: rewardResponse.detailLevel,
    userData,
    isPremium: rewardResponse.level > 0
  });

  // Génération du lead si données suffisantes
  let leadInfo = null;
  if (rewardResponse.level > 0) {
    leadInfo = await leadSystem.generateLead({
      userData,
      questionType,
      aiResponse: aiResponse.response,
      leadValue: rewardResponse.leadValue,
      partner: rewardResponse.optimalPartner
    });
  }

  // Tracking analytics
  rewardSystem.trackConversionEvent(
    'analysis_provided',
    userData,
    true
  );

  return res.status(200).json({
    success: true,
    response: aiResponse.response,
    userLevel: rewardResponse.level,
    levelName: rewardSystem.rewardThresholds[rewardResponse.level].name,
    
    // Stratégie de conversion (si applicable)
    conversionStrategy: rewardResponse.conversionStrategy,
    uiConfig: rewardResponse.uiConfig,
    
    // Informations business
    leadInfo: leadInfo,
    businessMetrics: {
      leadValue: rewardResponse.leadValue,
      partner: rewardResponse.optimalPartner,
      upgradeAvailable: !!rewardResponse.conversionStrategy
    },
    
    // Analytics pour le frontend
    analytics: {
      questionType,
      aiMode: rewardResponse.aiMode,
      processingTime: aiResponse.processingTime,
      timestamp: new Date().toISOString()
    }
  });
}

// Gère la collecte progressive de données
async function handleDataCollection(userData, res) {
  const currentLevel = rewardSystem.getUserLevel(userData);
  const newLevel = rewardSystem.getUserLevel(userData);
  
  // Validation que l'utilisateur a fourni les bonnes données
  const strategy = rewardSystem.getConversionStrategy(currentLevel, 'general');
  if (strategy) {
    const missingFields = strategy.required.filter(field => !userData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Données manquantes',
        missingFields,
        required: strategy.required
      });
    }
  }

  // Calcul de la valeur du lead
  const leadValue = rewardSystem.calculateLeadValue(userData, 'general');
  
  // Génération et envoi du lead aux partenaires
  const leadResult = await leadSystem.processLead({
    userData,
    leadValue,
    source: 'progressive_reward',
    level: newLevel
  });

  // Tracking de la conversion
  rewardSystem.trackConversionEvent(
    `data_collected_level_${newLevel}`,
    userData,
    true
  );

  return res.status(200).json({
    success: true,
    message: 'Données collectées avec succès',
    newLevel,
    levelName: rewardSystem.rewardThresholds[newLevel]?.name,
    leadValue,
    leadResult,
    unlockedFeatures: getUnlockedFeatures(newLevel)
  });
}

// Gère les demandes d'upgrade
async function handleUpgradeRequest(userData, res) {
  const currentLevel = rewardSystem.getUserLevel(userData);
  const strategy = rewardSystem.getConversionStrategy(currentLevel, 'general');
  
  if (!strategy) {
    return res.status(400).json({
      error: 'Aucun upgrade disponible pour ce niveau',
      currentLevel,
      maxLevel: Object.keys(rewardSystem.rewardThresholds).length - 1
    });
  }

  // Tracking de la demande d'upgrade
  rewardSystem.trackConversionEvent(
    'upgrade_requested',
    userData,
    false
  );

  return res.status(200).json({
    success: true,
    conversionStrategy: strategy,
    uiConfig: rewardSystem.generateDataCollectionUI(currentLevel, strategy),
    currentLevel,
    targetLevel: currentLevel + 1,
    benefits: getUpgradeBenefits(currentLevel + 1)
  });
}

// Récupère le statut utilisateur
async function handleGetUserStatus(req, res) {
  const { sessionId, ...userData } = req.query;
  
  const userLevel = rewardSystem.getUserLevel(userData);
  const nextStrategy = rewardSystem.getConversionStrategy(userLevel, 'general');
  
  return res.status(200).json({
    success: true,
    userLevel,
    levelName: rewardSystem.rewardThresholds[userLevel].name,
    unlockedFeatures: getUnlockedFeatures(userLevel),
    nextUpgrade: nextStrategy ? {
      strategy: nextStrategy,
      ui: rewardSystem.generateDataCollectionUI(userLevel, nextStrategy)
    } : null,
    analytics: {
      dataCompleteness: calculateDataCompleteness(userData),
      estimatedLeadValue: rewardSystem.calculateLeadValue(userData, 'general')
    }
  });
}

// Fonctions utilitaires
function detectQuestionType(message) {
  const keywords = {
    'engine': ['moteur', 'puissance', 'ralenti', 'fumée', 'voyant moteur', 'egr', 'fap'],
    'brakes': ['frein', 'freinage', 'bruit frein', 'pédale', 'plaquette'],
    'transmission': ['boite', 'vitesse', 'embrayage', 'transmission'],
    'electrical': ['électrique', 'batterie', 'alternateur', 'démarrage'],
    'general': ['voiture', 'automobile', 'véhicule', 'problème']
  };
  
  const messageLower = message.toLowerCase();
  
  for (const [type, words] of Object.entries(keywords)) {
    if (words.some(word => messageLower.includes(word))) {
      return type;
    }
  }
  
  return 'general';
}

function getUnlockedFeatures(level) {
  const features = {
    0: ['Diagnostic de base', 'Réponses générales'],
    1: ['Diagnostic avancé', 'Estimation coûts', 'Garages recommandés'],
    2: ['Expertise personnalisée', 'Devis gratuit', 'Rappel expert'],
    3: ['Service VIP', 'Diagnostic prédictif', 'Suivi personnalisé', 'Alertes maintenance']
  };
  
  return Object.values(features)
    .slice(0, level + 1)
    .flat();
}

function getUpgradeBenefits(targetLevel) {
  const benefits = {
    1: [
      'Diagnostic IA avancé (47 points de contrôle)',
      'Estimation précise des coûts (±10€)',
      'Garages recommandés dans votre région',
      'Rapport détaillé téléchargeable'
    ],
    2: [
      'Expert vous rappelle dans l\'heure',
      'Devis personnalisé gratuit',
      'Rendez-vous prioritaire',
      'Support téléphonique dédié'
    ],
    3: [
      'Diagnostic prédictif personnalisé',
      'Alertes maintenance intelligentes',
      'Suivi VIP à vie',
      'Accès prioritaire aux nouveautés'
    ]
  };
  
  return benefits[targetLevel] || [];
}

function calculateDataCompleteness(userData) {
  const allFields = ['email', 'firstName', 'location', 'phone', 'vehicleModel', 'urgency', 'vehicleYear', 'mileage'];
  const providedFields = Object.keys(userData).filter(key => 
    allFields.includes(key) && userData[key] && userData[key].length > 0
  );
  
  return Math.round((providedFields.length / allFields.length) * 100);
}
