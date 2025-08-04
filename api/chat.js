// API/chat.js
// Version finale pour FAP Expert - Format de réponse corrigé

module.exports = async (req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accepter seulement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { message, session_id } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message requis'
      });
    }

    // Analyser le message
    const lowerMessage = message.toLowerCase();
    
    // Réponse par défaut
    let responseText = "";
    let confidence = 0.5;
    let topCauses = [];
    let ctas = [];
    let progress = 0;
    let questionType = null;
    let options = null;
    let workflow = null;

    // Logique de réponse selon le message
    if (lowerMessage.includes('diagnostic rapide') || lowerMessage.includes('commencer')) {
      responseText = "Parfait ! Je vais diagnostiquer votre problème de FAP rapidement.\n\n**Question 1:** Observez-vous de la fumée à l'échappement ?";
      questionType = 'multiple_choice';
      options = [
        { id: 'black_smoke', label: '💨 Fumée noire' },
        { id: 'white_smoke', label: '☁️ Fumée blanche' },
        { id: 'blue_smoke', label: '🔵 Fumée bleue' },
        { id: 'no_smoke', label: '✅ Pas de fumée' }
      ];
      progress = 10;
      ctas = [
        { type: 'info', title: '💡 Besoin d\'aide ?', action: 'help' }
      ];
    }
    else if (lowerMessage.includes('fumée noire') || lowerMessage.includes('fumee noire')) {
      responseText = "La fumée noire indique généralement un **FAP encrassé**. C'est le problème le plus courant.\n\nAvez-vous également remarqué une perte de puissance ?";
      confidence = 0.75;
      topCauses = [
        { name: 'FAP encrassé', score: 0.8, description: 'Accumulation de suie dans le filtre' },
        { name: 'Régénération nécessaire', score: 0.15, description: 'Le FAP a besoin d\'un cycle de nettoyage' }
      ];
      ctas = [
        { type: 'primary', title: '✅ Oui, perte de puissance', action: 'confirm_power_loss' },
        { type: 'primary', title: '❌ Non, pas de perte', action: 'no_power_loss' }
      ];
      progress = 40;
    }
    else if (lowerMessage.includes('perte de puissance') || lowerMessage.includes('oui')) {
      responseText = "⚠️ **Diagnostic confirmé : FAP très encrassé**\n\nLa combinaison fumée noire + perte de puissance nécessite une intervention rapide. Je recommande un nettoyage professionnel urgent.";
      confidence = 0.9;
      topCauses = [
        { name: 'FAP très encrassé', score: 0.9, description: 'Nécessite intervention rapide' },
        { name: 'Risque de casse moteur', score: 0.1, description: 'Si non traité rapidement' }
      ];
      ctas = [
        { type: 'urgent', title: '🚨 Nettoyage urgent FAP', action: 'book_cleaning' },
        { type: 'primary', title: '🛣️ Essayer régénération autoroute', action: 'highway_regeneration' },
        { type: 'professional', title: '👨‍🔧 Contacter un pro', action: 'contact_expert' }
      ];
      workflow = {
        name: 'Nettoyage FAP professionnel',
        category: 'professional',
        success_probability: 0.85,
        steps: [
          { step: 1, title: 'Diagnostic complet', instructions: 'Vérification codes erreur et état FAP' },
          { step: 2, title: 'Nettoyage chimique', instructions: 'Application produit nettoyant Re-Fap' },
          { step: 3, title: 'Régénération forcée', instructions: 'Cycle de régénération haute température' }
        ]
      };
      progress = 80;
    }
    else if (lowerMessage.includes('voyant') || lowerMessage.includes('témoin')) {
      responseText = "Un voyant moteur allumé peut indiquer plusieurs problèmes FAP.\n\n**De quelle couleur est le voyant ?**\n• 🟠 Orange : Problème non urgent\n• 🔴 Rouge : Intervention immédiate";
      confidence = 0.6;
      ctas = [
        { type: 'primary', title: '🟠 Voyant orange', action: 'orange_light' },
        { type: 'urgent', title: '🔴 Voyant rouge', action: 'red_light' }
      ];
      progress = 30;
    }
    else {
      // Réponse par défaut
      responseText = "Bonjour ! Je suis Julien, votre expert FAP.\n\nJe peux diagnostiquer précisément votre problème de filtre à particules. Pour commencer, décrivez-moi vos symptômes :\n\n• Fumée à l'échappement ?\n• Voyants allumés ?\n• Perte de puissance ?\n• Codes d'erreur ?";
      ctas = [
        { type: 'primary', title: '🚀 Diagnostic rapide', action: 'quick_diagnosis' },
        { type: 'secondary', title: '📋 Analyse complète', action: 'full_analysis' }
      ];
      progress = 0;
    }

    // IMPORTANT: Retourner le format exact attendu par le frontend
    return res.status(200).json({
      success: true,
      response: responseText,  // PAS "message" mais "response"
      confidence: confidence,
      top_causes: topCauses,   // PAS "topCauses" mais "top_causes"
      ctas: ctas,
      session_state: 'active',
      current_progress: progress,
      question_type: questionType,
      options: options,
      recommended_workflow: workflow,
      
      // Champs optionnels
      requires_confirmation: false,
      post_diagnostic_active: false,
      external_link: null,
      form_active: false,
      garages_found: null
    });

  } catch (error) {
    console.error('Erreur chat:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};
