export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Seule la méthode POST est supportée'
    });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message requis'
      });
    }

    // Simulation du Dual Brain (version démo)
    const response = simulateDualBrain(message);

    return res.status(200).json({
      success: true,
      message: response.content,
      metadata: {
        strategy: response.strategy,
        confidence: response.confidence,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
}

// Simulation intelligente du Dual Brain
function simulateDualBrain(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Détection de sujets automobiles
  const autoKeywords = ['voiture', 'auto', 'moteur', 'frein', 'pneu', 'garage', 'réparation', 'entretien', 'vidange'];
  const isAutoTopic = autoKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (isAutoTopic) {
    return {
      content: `🚗 Concernant votre question automobile : "${userMessage}"\n\nJe recommande de faire vérifier cela par un professionnel rapidement. Pour des problèmes de freinage, la sécurité est primordiale.\n\n💡 Conseil : Contactez votre garage de confiance ou un spécialiste MIDAS/IDGARAGES pour un diagnostic précis.\n\n🚀 Passez en mode premium pour des conseils ultra-précis de notre IA double-puissance !`,
      strategy: 'auto_detection_premium_hint',
      confidence: 0.9
    };
  } else {
    return {
      content: `Merci pour votre question : "${userMessage}"\n\nJe suis votre assistant IA optimisé pour l'automobile. Pour des réponses encore plus précises et personnalisées, découvrez notre mode premium qui combine les forces de Claude et ChatGPT !\n\n💎 Mode Premium = Réponses 2x plus détaillées et créatives.`,
      strategy: 'general_with_premium_offer',
      confidence: 0.7
    };
  }
}
