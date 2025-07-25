// api/reward-system.js
// Version ultra-basique pour tester

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userData = {} } = req.body;

  // Détection niveau utilisateur simple
  let userLevel = 0;
  if (userData.email) userLevel = 1;
  if (userData.phone) userLevel = 2;
  if (userData.vehicleModel) userLevel = 3;

  // Stratégie de conversion selon le niveau
  let conversionStrategy = null;
  if (userLevel === 0) {
    conversionStrategy = {
      trigger: "🔓 Pour un diagnostic complet, laissez votre email !",
      required: ["email", "firstName", "location"],
      reward: "diagnostic premium gratuit"
    };
  } else if (userLevel === 1) {
    conversionStrategy = {
      trigger: "📞 Un expert peut vous rappeler pour un devis gratuit !",
      required: ["phone", "vehicleModel"],
      reward: "expert vous rappelle"
    };
  }

  // Calcul valeur lead
  const leadValue = userLevel === 0 ? 0 : userLevel === 1 ? 25 : userLevel === 2 ? 45 : 70;

  // Réponse selon le niveau
  const responses = {
    0: "Diagnostic de base : Problème de freinage détecté. Pour plus de détails...",
    1: "Diagnostic avancé : Analyse approfondie de vos freins avec recommandations.",
    2: "Expertise premium : Diagnostic complet avec devis personnalisé.",
    3: "Service VIP : Suivi personnalisé activé."
  };

  return res.status(200).json({
    success: true,
    response: responses[userLevel],
    userLevel,
    levelName: `Niveau ${userLevel}`,
    conversionStrategy,
    businessMetrics: {
      leadValue,
      partner: "MIDAS",
      upgradeAvailable: !!conversionStrategy
    },
    analytics: {
      questionType: message?.includes('frein') ? 'brakes' : 'general',
      timestamp: new Date().toISOString()
    }
  });
}
