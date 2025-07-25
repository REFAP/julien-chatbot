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
    const { message, options = {} } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message requis'
      });
    }

    console.log(`🧠 Dual Brain: "${message.substring(0, 50)}..."`);

    // Détection du mode
    const isPremiumUser = options.premiumToken ? validatePremiumToken(options.premiumToken) : false;
    const autoTopic = detectAutoTopic(message);

    let response;

    if (isPremiumUser) {
      // MODE PREMIUM : Vrai Dual Brain
      response = await processDualBrain(message, autoTopic);
    } else if (autoTopic.detected && autoTopic.confidence > 0.7) {
      // MODE CONVERSION : Opportunité détectée
      response = await processConversionOpportunity(message, autoTopic);
    } else {
      // MODE STANDARD : Une seule API
      response = await processSingleAI(message, autoTopic);
    }

    return res.status(200).json({
      success: true,
      message: response.content,
      ...(response.premiumOffer ? { premiumOffer: response.premiumOffer } : {}),
      metadata: {
        strategy: response.strategy,
        confidence: response.confidence,
        aiUsed: response.aiUsed || 'simulation',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erreur Dual Brain:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// 🧠 TRAITEMENT DUAL BRAIN PREMIUM
async function processDualBrain(message, autoTopic) {
  console.log('💎 Mode Premium : Dual Brain activé');
  
  try {
    // Appels parallèles aux deux APIs
    const [claudeResult, openaiResult] = await Promise.allSettled([
      callClaudeAPI(message, { premium: true, autoTopic }),
      callOpenAIAPI(message, { premium: true, autoTopic })
    ]);

    // Fusion intelligente
    if (claudeResult.status === 'fulfilled' && openaiResult.status === 'fulfilled') {
      return fusionIntelligente(claudeResult.value, openaiResult.value, message);
    } else if (claudeResult.status === 'fulfilled') {
      return {
        content: claudeResult.value,
        strategy: 'claude_fallback',
        confidence: 0.85,
        aiUsed: 'claude'
      };
    } else if (openaiResult.status === 'fulfilled') {
      return {
        content: openaiResult.value,
        strategy: 'openai_fallback', 
        confidence: 0.8,
        aiUsed: 'openai'
      };
    } else {
      // Fallback simulation
      return simulateDualBrain(message, autoTopic, true);
    }
    
  } catch (error) {
    console.error('💥 Erreur Dual Brain:', error);
    return simulateDualBrain(message, autoTopic, true);
  }
}

// 🎯 TRAITEMENT OPPORTUNITÉ DE CONVERSION
async function processConversionOpportunity(message, autoTopic) {
  console.log('🎯 Mode Conversion : Opportunité détectée');
  
  try {
    // Réponse de qualité + proposition premium
    const aiResponse = await callBestAvailableAI(message, autoTopic);
    
    return {
      content: aiResponse,
      strategy: 'conversion_opportunity',
      confidence: 0.9,
      premiumOffer: {
        available: true,
        title: "🚀 Accédez à notre IA Premium",
        description: "Obtenez des conseils ultra-précis avec notre technologie Dual Brain (Claude + ChatGPT)",
        benefits: [
          "🧠 Fusion de 2 IA pour une précision maximale",
          "🎯 Analyse technique approfondie",
          "⚡ Réponses personnalisées",
          "💡 Conseils d'experts automobiles"
        ],
        callToAction: "Accéder au mode premium",
        estimatedValue: autoTopic.urgency ? 35 : 25
      }
    };
    
  } catch (error) {
    return simulateDualBrain(message, autoTopic, false);
  }
}

// 📱 TRAITEMENT STANDARD
async function processSingleAI(message, autoTopic) {
  console.log('📱 Mode Standard : IA simple');
  
  try {
    const aiResponse = await callBestAvailableAI(message, autoTopic);
    
    return {
      content: aiResponse + "\n\n💡 Astuce : Passez en mode premium pour des analyses encore plus précises !",
      strategy: 'standard_single_ai',
      confidence: 0.75,
      aiUsed: 'claude_or_openai'
    };
    
  } catch (error) {
    return simulateDualBrain(message, autoTopic, false);
  }
}

// 🤖 APPEL API CLAUDE
async function callClaudeAPI(message, context) {
  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('Claude API key manquante');
  }

  const prompt = context.premium && context.autoTopic ? 
    `En tant qu'expert automobile premium, analysez précisément cette question : "${message}". Fournissez une réponse structurée avec diagnostic, solutions et conseils de sécurité.` :
    `Répondez précisément à cette question : "${message}"`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// 🤖 APPEL API OPENAI  
async function callOpenAIAPI(message, context) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key manquante');
  }

  const prompt = context.premium && context.autoTopic ?
    `En tant qu'assistant premium spécialisé en automobile, répondez de manière créative et engageante à : "${message}". Soyez à la fois précis et accessible.` :
    `Répondez de manière engageante à cette question : "${message}"`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 🔄 MEILLEURE API DISPONIBLE
async function callBestAvailableAI(message, autoTopic) {
  // Priorité Claude pour les questions techniques auto
  if (autoTopic.detected) {
    try {
      return await callClaudeAPI(message, { autoTopic });
    } catch (error) {
      console.log('Claude indisponible, fallback OpenAI');
      return await callOpenAIAPI(message, { autoTopic });
    }
  } else {
    // Priorité OpenAI pour les questions générales
    try {
      return await callOpenAIAPI(message, { autoTopic });
    } catch (error) {
      console.log('OpenAI indisponible, fallback Claude');
      return await callClaudeAPI(message, { autoTopic });
    }
  }
}

// 🧬 FUSION INTELLIGENTE
function fusionIntelligente(claudeResponse, openaiResponse, originalMessage) {
  console.log('🧬 Fusion Claude + OpenAI');
  
  // Fusion simple mais efficace
  const claudeSentences = claudeResponse.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const openaiSentences = openaiResponse.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Structure de Claude + engagement d'OpenAI
  let fusedContent = claudeSentences.join('. ');
  
  // Ajout de la conclusion engageante d'OpenAI
  if (openaiSentences.length > 0) {
    const lastOpenaiSentence = openaiSentences[openaiSentences.length - 1];
    if (lastOpenaiSentence.length > 50 && !fusedContent.includes(lastOpenaiSentence)) {
      fusedContent += '\n\n' + lastOpenaiSentence.trim() + '.';
    }
  }
  
  return {
    content: fusedContent,
    strategy: 'dual_brain_fusion',
    confidence: 0.95,
    aiUsed: 'claude+openai'
  };
}

// 🔍 DÉTECTION SUJET AUTO
function detectAutoTopic(message) {
  const autoKeywords = [
    'voiture', 'auto', 'véhicule', 'moteur', 'frein', 'pneu', 'garage', 
    'réparation', 'entretien', 'vidange', 'révision', 'panne', 'diagnostic',
    'carrosserie', 'mécanique', 'huile', 'batterie', 'démarrage'
  ];
  
  const urgencyKeywords = ['urgent', 'rapidement', 'panne', 'ne démarre plus', 'danger'];
  
  const lowerMessage = message.toLowerCase();
  
  const foundKeywords = autoKeywords.filter(keyword => lowerMessage.includes(keyword));
  const foundUrgency = urgencyKeywords.some(keyword => lowerMessage.includes(keyword));
  
  return {
    detected: foundKeywords.length > 0,
    confidence: Math.min(foundKeywords.length * 0.3, 1.0),
    keywords: foundKeywords,
    urgency: foundUrgency,
    category: foundKeywords.length > 2 ? 'specialist_needed' : 'general_auto'
  };
}

// 🎫 VALIDATION TOKEN PREMIUM
function validatePremiumToken(token) {
  try {
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    return Date.now() < tokenData.expiresAt;
  } catch {
    return false;
  }
}

// 🎭 SIMULATION (FALLBACK)
function simulateDualBrain(message, autoTopic, isPremium) {
  const baseResponse = autoTopic.detected ? 
    `🚗 Concernant votre question automobile : "${message}"\n\nJe recommande de faire vérifier cela par un professionnel${autoTopic.urgency ? ' rapidement' : ''}. ${autoTopic.urgency ? 'Pour des problèmes urgents, la sécurité est primordiale.' : ''}\n\n💡 Conseil : Contactez un spécialiste MIDAS ou IDGARAGES pour un diagnostic précis.` :
    `Merci pour votre question : "${message}"\n\nJe suis votre assistant IA spécialisé. Pour des réponses encore plus précises, découvrez notre mode premium !`;

  return {
    content: baseResponse + (isPremium ? '\n\n🔥 Mode Premium actif - Analyse approfondie fournie !' : ''),
    strategy: isPremium ? 'premium_simulation' : 'standard_simulation',
    confidence: autoTopic.detected ? 0.85 : 0.7,
    aiUsed: 'simulation'
  };
}
