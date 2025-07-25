// api/reward-system.js
// Version minimale du système de récompense - Sans imports complexes

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message, userData = {}, action = 'analyze', sessionId } = req.body;

    // Validation
    if (!message && action !== 'collect_data') {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Détection du niveau utilisateur
    const userLevel = getUserLevel(userData);
    
    // Détection du type de question
    const questionType = detectQuestionType(message || '');
    
    // Génération de la stratégie selon le niveau
    const strategy = getConversionStrategy(userLevel, questionType);
    
    // Calcul de la valeur du lead
    const leadValue = calculateLeadValue(userData, questionType);
    
    // Génération de la réponse selon le niveau
    const response = generateResponseByLevel(message, userLevel, questionType);

    return res.status(200).json({
      success: true,
      response,
      userLevel,
      levelName: getLevelName(userLevel),
      
      // Stratégie de conversion
      conversionStrategy: strategy,
      uiConfig: strategy ? generateUIConfig(userLevel, strategy) : null,
      
      // Informations business
      businessMetrics: {
        leadValue,
        partner: getOptimalPartner(questionType, leadValue),
        upgradeAvailable: !!strategy
      },
      
      // Analytics
      analytics: {
        questionType,
        timestamp: new Date().toISOString(),
        sessionId
      }
    });

  } catch (error) {
    console.error('Erreur reward system:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  }
}

// Fonctions utilitaires intégrées
function getUserLevel(userData) {
  const { email, phone, vehicleModel, location } = userData || {};
  
  if (phone && vehicleModel && location) return 3; // Full profile
  if (phone && email) return 2; // Phone verified
  if (email) return 1; // Email verified
  return 0; // Anonymous
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
    0: { // Anonymous → Email
      trigger: `🔓 **Diagnostic ${questionType === 'brakes' ? 'freinage' : 'moteur'} complet disponible !**\n\nD'après mon analyse, votre problème nécessite un diagnostic approfondi. Mes algorithmes avancés peuvent analyser 47 points de contrôle supplémentaires.\n\n💎 **Valeur : 50€ d'expertise gratuite**\nIl vous suffit de laisser votre email pour débloquer le rapport complet.`,
      required: ['email', 'firstName', 'location'],
      reward: 'diagnostic premium avec estimation coûts',
      value: '50€ d\'expertise gratuite'
    },
    
    1: { // Email → Phone
      trigger: `📞 **Expertise maximale disponible !**\n\nNos partenaires experts peuvent vous rappeler dans l'heure pour un devis personnalisé précis et un conseil spécialisé.\n\n💎 **Service habituellement facturé 80€ - GRATUIT pour vous**`,
      required: ['phone', 'vehicleModel', 'urgency'],
      reward: 'mise en relation directe avec garage partenaire',
      value: 'Devis personnalisé + Rdv prioritaire'
    },
    
    2: { // Phone → Full Profile
      trigger: `🏆 **Service VIP - Diagnostic prédictif !**\n\nAvec l'historique complet de votre véhicule, notre IA peut prédire les prochaines pannes et optimiser vos coûts maintenance.\n\n🎁 **Service premium exclusif - Accès VIP à vie**`,
      required: ['vehicleYear', 'mileage', 'maintenanceHistory'],
      reward: 'diagnostic prédictif et suivi personnalisé',
      value: 'Prévention pannes futures'
    }
  };
  
  return strategies[level] || null;
}

function calculateLeadValue(userData, questionType) {
  const baseValues = {
    'engine': 35,
    'brakes': 40,
    'transmission': 45,
    'general': 25
  };
  
  const level = getUserLevel(userData);
  const multipliers = [0, 1, 1.8, 2.5]; // Par niveau
  
  const baseValue = baseValues[questionType] || 25;
  return Math.round(baseValue * (multipliers[level] || 1));
}

function getOptimalPartner(questionType, leadValue) {
  if (questionType === 'brakes' && leadValue <= 40) return 'MIDAS';
  if (questionType === 'engine' && leadValue >= 35) return 'IDGARAGES';
  return 'MIDAS';
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

function generateResponseByLevel(message, level, questionType) {
  const responses = {
    0: `**Diagnostic de base** pour votre problème de ${questionType === 'brakes' ? 'freinage' : questionType === 'engine' ? 'moteur' : 'véhicule'}.\n\nD'après mon analyse initiale, ${questionType === 'brakes' ? 'les freins nécessitent une vérification' : 'le moteur présente des symptômes à analyser'}. Pour un diagnostic complet...`,
    
    1: `**Diagnostic avancé** de votre ${questionType}.\n\nAnalyse approfondie terminée : ${questionType === 'brakes' ? 'système de freinage à contrôler en priorité' : 'problème moteur identifié avec précision'}. Estimation des coûts disponible. Pour une expertise personnalisée...`,
    
    2: `**Expertise premium** de votre problème.\n\nDiagnostic complet effectué par nos algorithmes avancés. Expert partenaire contacté pour devis personnalisé. Pour un suivi prédictif...`,
    
    3: `**Service VIP activé** - Diagnostic prédictif personnalisé.\n\nAnalyse complète de votre véhicule avec prédictions d'entretien et optimisation des coûts. Suivi automatique activé.`
  };
  
  return responses[level] || responses[0];
}

function generateUIConfig(level, strategy) {
  const configs = {
    0: {
      title: "🔓 Diagnostic Premium Gratuit",
      subtitle: strategy.value,
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
