// api/chat.js
// Version simple basée sur ce qui fonctionnait

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, isPremium = false, userData = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Détection simple du niveau utilisateur
    let userLevel = 0;
    if (userData.email) userLevel = 1;
    if (userData.phone) userLevel = 2;

    // Réponse selon le type de question (comme votre version originale)
    let response = "";
    let needType = "general";

    if (message.toLowerCase().includes('frein')) {
      needType = "brakes";
      if (userLevel === 0) {
        response = "**Diagnostic de base** pour votre problème de freinage.\n\nD'après mon analyse initiale, les freins nécessitent une vérification urgente. Bruit suspect détecté.\n\n🔓 **Pour un diagnostic complet, laissez votre email pour débloquer l'analyse premium !**";
      } else {
        response = "**Diagnostic avancé** de vos freins.\n\nAnalyse approfondie terminée : système de freinage à contrôler en priorité. Plaquettes probablement usées. Estimation des coûts : 150-300€.";
      }
    } else if (message.toLowerCase().includes('moteur') || message.toLowerCase().includes('voyant')) {
      needType = "engine";
      if (userLevel === 0) {
        response = "**Diagnostic de base** pour votre problème moteur.\n\nD'après mon analyse initiale, le moteur présente des symptômes à analyser. Possible problème EGR/FAP.\n\n🔓 **Pour un diagnostic complet, laissez votre email pour débloquer l'analyse premium !**";
      } else {
        response = "**Diagnostic avancé** de votre moteur.\n\nAnalyse approfondie terminée : problème moteur identifié avec précision. Intervention rapide recommandée. Estimation : 200-500€.";
      }
    } else {
      if (userLevel === 0) {
        response = "**Diagnostic de base** pour votre problème automobile.\n\nD'après mon analyse initiale, votre véhicule nécessite un diagnostic approfondi.\n\n🔓 **Pour un diagnostic complet, laissez votre email pour débloquer l'analyse premium !**";
      } else {
        response = "**Diagnostic avancé** de votre véhicule.\n\nAnalyse approfondie terminée avec recommandations ciblées. Estimation disponible.";
      }
    }

    // Calcul du score et lead value selon le niveau
    const baseScore = needType === "brakes" ? 8.5 : needType === "engine" ? 8.0 : 7.5;
    const leadValue = userLevel === 0 ? 0 : (needType === "brakes" ? 40 : needType === "engine" ? 35 : 25) * (userLevel === 1 ? 1 : 1.8);

    return res.status(200).json({
      success: true,
      message: response,
      strategy: userLevel > 0 ? "enhanced_simulation" : "standard_simulation",
      aiMood: userLevel > 0 ? "enhanced_simulation" : "standard_simulation",
      score: baseScore,
      timestamp: new Date().toISOString(),
      isPremium: userLevel > 0,
      
      // Données business
      metadata: {
        needType,
        userLevel,
        leadValue: Math.round(leadValue),
        partner: needType === "brakes" ? "MIDAS" : "IDGARAGES",
        upgradeAvailable: userLevel === 0
      }
    });

  } catch (error) {
    console.error('Erreur chat:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  }
}
