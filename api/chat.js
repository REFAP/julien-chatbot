// API/chat.js
// Version corrigée pour le chatbot FAP Expert

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, session_id } = req.body;

    if (!message || !session_id) {
      return res.status(400).json({
        success: false,
        error: 'Message et session_id sont requis'
      });
    }

    // Analyser le message pour détecter les symptômes FAP
    const lowerMessage = message.toLowerCase();
    const symptoms = analyzeSymptoms(lowerMessage);
    const diagnosis = calculateDiagnosis(symptoms);
    
    // Générer une réponse appropriée
    const response = generateResponse(lowerMessage, symptoms, diagnosis);

    return res.status(200).json({
      success: true,
      response: response.text,
      confidence: response.confidence,
      top_causes: response.topCauses,
      ctas: response.ctas,
      session_state: 'active',
      current_progress: response.progress,
      question_type: response.questionType,
      options: response.options,
      recommended_workflow: response.workflow
    });

  } catch (error) {
    console.error('Erreur chat:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: error.message
    });
  }
};

// Fonction pour analyser les symptômes
function analyzeSymptoms(message) {
  const symptoms = {
    smoke_color: null,
    power_loss: false,
    warning_light: false,
    error_code: null,
    high_consumption: false
  };

  // Détection de fumée
  if (message.includes('fumée noire') || message.includes('fumee noire')) {
    symptoms.smoke_color = 'black';
  } else if (message.includes('fumée blanche') || message.includes('fumee blanche')) {
    symptoms.smoke_color = 'white';
  } else if (message.includes('fumée bleue') || message.includes('fumee bleue')) {
    symptoms.smoke_color = 'blue';
  }

  // Perte de puissance
  if (message.includes('perte de puissance') || message.includes('perte puissance')) {
    symptoms.power_loss = true;
  }

  // Voyants
  if (message.includes('voyant') || message.includes('témoin')) {
    symptoms.warning_light = true;
  }

  // Codes erreur
  const errorMatch = message.match(/p[0-9]{4}/i);
  if (errorMatch) {
    symptoms.error_code = errorMatch[0].toUpperCase();
  }

  // Consommation excessive
  if (message.includes('consomm') || message.includes('essence') || message.includes('diesel')) {
    symptoms.high_consumption = true;
  }

  return symptoms;
}

// Fonction pour calculer le diagnostic
function calculateDiagnosis(symptoms) {
  const scores = {
    clogged_filter: 0,
    sensor_failure: 0,
    additive_issue: 0,
    regeneration_needed: 0
  };

  // Calcul basé sur les symptômes
  if (symptoms.smoke_color === 'black') {
    scores.clogged_filter += 0.4;
    scores.regeneration_needed += 0.2;
  }

  if (symptoms.power_loss) {
    scores.clogged_filter += 0.3;
    scores.regeneration_needed += 0.2;
  }

  if (symptoms.warning_light) {
    scores.sensor_failure += 0.2;
    scores.clogged_filter += 0.2;
  }

  if (symptoms.error_code) {
    if (['P2002', 'P2003'].includes(symptoms.error_code)) {
      scores.clogged_filter += 0.5;
    } else if (['P2452', 'P2453'].includes(symptoms.error_code)) {
      scores.sensor_failure += 0.5;
    }
  }

  // Normaliser les scores
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  for (const key in scores) {
    scores[key] = scores[key] / total;
  }

  return scores;
}

// Fonction pour générer la réponse
function generateResponse(message, symptoms, diagnosis) {
  const response = {
    text: '',
    confidence: 0,
    topCauses: [],
    ctas: [],
    progress: 0,
    questionType: null,
    options: null,
    workflow: null
  };

  // Trier les causes par score
  const sortedCauses = Object.entries(diagnosis)
    .sort(([, a], [, b]) => b - a)
    .map(([cause, score]) => ({
      name: getCauseName(cause),
      score: score,
      description: getCauseDescription(cause)
    }));

  response.topCauses = sortedCauses.slice(0, 3);
  response.confidence = sortedCauses[0].score;

  // Logique de réponse selon le contexte
  if (message.includes('diagnostic rapide') || message.includes('commencer')) {
    response.text = "Parfait ! Je vais analyser votre problème de FAP rapidement.\n\n**Question 1:** Observez-vous de la fumée à l'échappement ?";
    response.questionType = 'multiple_choice';
    response.options = [
      { id: 'black_smoke', label: '💨 Fumée noire' },
      { id: 'white_smoke', label: '☁️ Fumée blanche' },
      { id: 'blue_smoke', label: '🔵 Fumée bleue' },
      { id: 'no_smoke', label: '✅ Pas de fumée' }
    ];
    response.progress = 10;
    response.ctas = [
      { type: 'info', title: '💡 Besoin d\'aide ?', action: 'help' }
    ];
  }
  else if (symptoms.smoke_color || symptoms.power_loss || symptoms.warning_light) {
    // Diagnostic basé sur les symptômes
    const topCause = sortedCauses[0];
    
    if (topCause.score > 0.7) {
      response.text = `D'après mon analyse, le problème principal est : **${topCause.name}**\n\n`;
      response.text += `Probabilité: ${Math.round(topCause.score * 100)}%\n\n`;
      
      if (symptoms.smoke_color === 'black' && symptoms.power_loss) {
        response.text += "⚠️ **Situation urgente** : La combinaison fumée noire + perte de puissance indique un FAP très encrassé nécessitant une intervention rapide.";
        response.ctas = [
          { type: 'urgent', title: '🚨 Nettoyage urgent', action: 'book_cleaning' },
          { type: 'primary', title: '🛣️ Régénération autoroute', action: 'highway_regeneration' }
        ];
        response.progress = 80;
      } else {
        response.text += "Je recommande d'agir rapidement pour éviter des dommages plus importants.";
        response.ctas = [
          { type: 'primary', title: '🔧 Voir les solutions', action: 'show_solutions' },
          { type: 'secondary', title: '📊 Diagnostic complet', action: 'full_diagnosis' }
        ];
        response.progress = 60;
      }
      
      // Ajouter un workflow si pertinent
      if (diagnosis.clogged_filter > 0.5) {
        response.workflow = {
          name: 'Nettoyage FAP professionnel',
          category: 'professional',
          success_probability: 0.85,
          steps: [
            { step: 1, title: 'Diagnostic', instructions: 'Vérification codes et état FAP', duration: '30 min' },
            { step: 2, title: 'Nettoyage', instructions: 'Application produit Re-Fap', duration: '2h' },
            { step: 3, title: 'Test', instructions: 'Vérification après nettoyage', duration: '30 min' }
          ]
        };
      }
    } else {
      response.text = "J'ai besoin de plus d'informations pour affiner le diagnostic.\n\n**Avez-vous aussi une perte de puissance ?**";
      response.questionType = 'yes_no';
      response.ctas = [
        { type: 'primary', title: '✅ Oui', action: 'answer_yes' },
        { type: 'primary', title: '❌ Non', action: 'answer_no' }
      ];
      response.progress = 40;
    }
  }
  else {
    // Message par défaut
    response.text = "Je suis Julien, expert FAP. Je peux diagnostiquer précisément votre problème de filtre à particules.\n\nPour commencer, décrivez-moi vos symptômes :\n• Fumée à l'échappement ?\n• Voyants allumés ?\n• Perte de puissance ?\n• Codes d'erreur ?";
    response.ctas = [
      { type: 'primary', title: '🚀 Diagnostic rapide', action: 'quick_diagnosis' },
      { type: 'secondary', title: '📋 Analyse complète', action: 'full_analysis' }
    ];
    response.progress = 0;
  }

  return response;
}

// Fonctions utilitaires
function getCauseName(cause) {
  const names = {
    clogged_filter: 'FAP encrassé',
    sensor_failure: 'Défaillance capteur',
    additive_issue: 'Problème d\'additif FAP',
    regeneration_needed: 'Régénération nécessaire'
  };
  return names[cause] || cause;
}

function getCauseDescription(cause) {
  const descriptions = {
    clogged_filter: 'Le filtre est obstrué par les particules de suie',
    sensor_failure: 'Un capteur du système FAP dysfonctionne',
    additive_issue: 'Le niveau d\'additif FAP est insuffisant',
    regeneration_needed: 'Le FAP a besoin d\'un cycle de régénération'
  };
  return descriptions[cause] || '';
}
