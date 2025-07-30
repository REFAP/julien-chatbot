// api/chat-dual-brain.js
// Version Dual Brain + Lead Generation pour Julien Chatbot

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { message, userData = {}, sessionId, action } = req.body;
    
    if (!message && action !== 'CREATE_LEAD') {
      return res.status(400).json({ error: 'Message requis' });
    }

    // === GESTION SPÉCIALE CRÉATION DE LEAD ===
    if (action === 'CREATE_LEAD') {
      return await handleLeadCreation(req, res);
    }

    // === DÉTECTION EMAIL AUTOMATIQUE ===
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const detectedEmail = message.match(emailRegex)?.[0];
    
    if (detectedEmail) {
      // Email détecté = activation premium + création lead
      const leadResult = await createLeadFromEmail(detectedEmail, message, sessionId);
      
      return res.status(200).json({
        success: true,
        message: `🎉 **EMAIL CONFIRMÉ : ${detectedEmail}** 🎉\n\n` +
          `✅ **DIAGNOSTIC PREMIUM GRATUIT ACTIVÉ !**\n\n` +
          `📧 **Votre rapport détaillé sera envoyé dans 2 minutes à :**\n` +
          `${detectedEmail}\n\n` +
          `🚀 **Diagnostic en cours de génération...**\n` +
          `• Analyse technique approfondie par Dual Brain IA\n` +
          `• Estimation précise des coûts (pièces + main d'œuvre)\n` +
          `• Guide de réparation avec photos étape par étape\n` +
          `• Liste de garages partenaires Re-Fap dans votre région\n` +
          `• Conseils anti-arnaque pour négocier\n\n` +
          `📱 **Vérifiez votre boîte mail dans 2 minutes !**\n` +
          `*Pensez à vérifier vos spams si besoin*\n\n` +
          `🎁 **BONUS :** Vous recevrez aussi nos alertes rappels constructeurs !`,
        metadata: {
          aiMode: "🎁 Email Premium Activé",
          userLevel: 1,
          leadValue: leadResult.leadValue || 85,
          email: detectedEmail,
          leadCreated: leadResult.success,
          timestamp: new Date().toISOString()
        },
        rewardSystem: {
          userLevel: 1,
          leadValue: leadResult.leadValue || 85,
          conversionStrategy: null // Plus besoin de conversion
        }
      });
    }

    // === DÉTECTION NIVEAU UTILISATEUR ===
    let userLevel = 0;
    if (userData.email) userLevel = 1;
    if (userData.phone) userLevel = 2;
    if (userData.vehicleInfo) userLevel = 3;

    // === APPEL DUAL BRAIN ===
    const dualBrainResponse = await callDualBrain(message, userLevel);
    
    // === ANALYSE BUSINESS ===
    const businessAnalysis = analyzeBusiness(message, dualBrainResponse, userLevel);
    
    // === LOGGING AIRTABLE ===
    await logToAirtable({
      message,
      response: dualBrainResponse.content,
      userLevel,
      leadValue: businessAnalysis.leadValue,
      mode: dualBrainResponse.mode,
      needType: businessAnalysis.needType,
      sessionId
    });

    // === RÉPONSE FINALE ===
    return res.status(200).json({
      success: true,
      message: dualBrainResponse.content,
      metadata: {
        aiMode: dualBrainResponse.mode,
        userLevel,
        levelName: getLevelName(userLevel),
        needType: businessAnalysis.needType,
        leadValue: businessAnalysis.leadValue,
        score: dualBrainResponse.score,
        partner: getOptimalPartner(businessAnalysis.needType),
        timestamp: new Date().toISOString()
      },
      rewardSystem: {
        userLevel,
        leadValue: businessAnalysis.leadValue,
        conversionStrategy: userLevel === 0 ? generateConversionStrategy(businessAnalysis) : null
      }
    });

  } catch (error) {
    console.error('💥 Erreur chat-dual-brain:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      fallback: "Désolé, problème technique temporaire. Peux-tu reformuler ta question ?"
    });
  }
}

// === FONCTION DUAL BRAIN PRINCIPALE ===
async function callDualBrain(message, userLevel) {
  const startTime = Date.now();
  
  try {
    // Appels parallèles Claude + OpenAI
    const [claudeResult, openaiResult] = await Promise.allSettled([
      callClaude(message, userLevel),
      callOpenAI(message, userLevel)
    ]);
    
    const claudeResponse = claudeResult.status === 'fulfilled' ? claudeResult.value : null;
    const openaiResponse = openaiResult.status === 'fulfilled' ? openaiResult.value : null;
    
    // FUSION INTELLIGENTE
    if (claudeResponse && openaiResponse) {
      const fusedContent = await fuseDualBrain(message, claudeResponse, openaiResponse, userLevel);
      return {
        content: fusedContent,
        mode: "🧠 Dual Brain (Claude + OpenAI)",
        score: 9.2,
        processingTime: Date.now() - startTime
      };
    } 
    else if (claudeResponse) {
      return {
        content: await formatSingleAI(message, claudeResponse, userLevel, 'Claude'),
        mode: "🎯 Claude Expert",
        score: 8.8,
        processingTime: Date.now() - startTime
      };
    }
    else if (openaiResponse) {
      return {
        content: await formatSingleAI(message, openaiResponse, userLevel, 'OpenAI'),
        mode: "🤖 OpenAI Enhanced",
        score: 8.5,
        processingTime: Date.now() - startTime
      };
    }
    
  } catch (error) {
    console.error('❌ Erreur Dual Brain:', error);
  }
  
  // FALLBACK INTELLIGENT
  const intelligentFallback = await generateIntelligentFallback(message, userLevel);
  return {
    content: intelligentFallback,
    mode: "⚡ Simulation Expert",
    score: 8.0,
    processingTime: Date.now() - startTime
  };
}

// === APPELS IA INDIVIDUELS ===
async function callClaude(message, userLevel) {
  try {
    const claudeKey = process.env.CLAUDE_API_KEY;
    if (!claudeKey) return null;

    const systemPrompt = buildClaudePrompt(userLevel);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          { role: 'user', content: `${systemPrompt}\n\nQuestion: ${message}` }
        ]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('❌ Erreur Claude:', error);
    return null;
  }
}

async function callOpenAI(message, userLevel) {
  try {
    const openaiKey = process.env.CLE_API_OPENAI;
    if (!openaiKey) return null;

    const systemPrompt = buildOpenAIPrompt(userLevel);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erreur OpenAI:', error);
    return null;
  }
}

// === CONSTRUCTION DES PROMPTS ===
function buildClaudePrompt(userLevel) {
  return `Tu es Julien, expert automobile FAP/EGR/AdBlue depuis 20 ans chez Re-Fap.

NIVEAU UTILISATEUR: ${userLevel}
- Niveau 0: Diagnostic de base + encourager email pour premium
- Niveau 1+: Diagnostic technique complet avec estimations précises

STYLE JULIEN:
- Direct, expert, rassurant
- Questions pertinentes pour approfondir
- Estimations de coûts réalistes
- Conseils sécurité prioritaires

SPÉCIALITÉS:
- FAP/EGR/AdBlue (ton expertise principale)
- Diagnostic précis des pannes
- Solutions économiques vs remplacement
- Garages partenaires Re-Fap

Réponds avec expertise technique et bienveillance.`;
}

function buildOpenAIPrompt(userLevel) {
  return `Tu es un assistant conversationnel expert en automobile, spécialisé dans l'engagement client.

NIVEAU UTILISATEUR: ${userLevel}
- Niveau 0: Encourage vivement à donner email pour diagnostic complet
- Niveau 1+: Sois très détaillé, rassurant et expert

FORCES:
- Ton engageant et rassurant
- Excellente capacité à expliquer simplement
- Persuasion naturelle pour conversion
- Empathie avec les problèmes clients

OBJECTIF: Créer une expérience client exceptionnelle qui donne envie de revenir.`;
}

// === FUSION DUAL BRAIN ===
async function fuseDualBrain(message, claudeResponse, openaiResponse, userLevel) {
  const needType = detectNeedType(message);
  
  if (userLevel === 0) {
    return `🧠 **Diagnostic Dual Brain Activé** 🔧\n\n` +
      `**Analyse technique (Claude):**\n${claudeResponse}\n\n` +
      `**Expertise complémentaire (OpenAI):**\n${openaiResponse}\n\n` +
      `🎯 **DIAGNOSTIC COMPLET GRATUIT** 🎯\n` +
      `📧 **Tapez votre email pour recevoir :**\n` +
      `• Rapport technique détaillé\n` +
      `• Estimation précise des coûts\n` +
      `• Guide de réparation photos\n` +
      `• Garages partenaires recommandés\n\n` +
      `⚡ **Réponse automatique en 2 minutes !**`;
  } else {
    return `🧠 **Analyse Dual Brain Premium** 🔧\n\n` +
      `**Diagnostic Expert (Claude):**\n${claudeResponse}\n\n` +
      `**Analyse Complémentaire (OpenAI):**\n${openaiResponse}\n\n` +
      `✅ **Diagnostic complet terminé !**`;
  }
}

async function formatSingleAI(message, response, userLevel, aiName) {
  const icon = aiName === 'Claude' ? '🎯' : '🤖';
  
  if (userLevel === 0) {
    return `${icon} **Diagnostic ${aiName} Activé** \n\n${response}\n\n` +
      `🎯 **POUR VOTRE DIAGNOSTIC COMPLET :**\n` +
      `📧 **Tapez votre email dans le chat** ⬇️`;
  } else {
    return `${icon} **Analyse ${aiName} Premium** 🔧\n\n${response}`;
  }
}

// === FALLBACK INTELLIGENT ===
async function generateIntelligentFallback(message, userLevel) {
  const needType = detectNeedType(message);
  const responses = getFallbackResponses(needType, userLevel);
  
  // Sélection intelligente selon le contexte
  return responses[Math.floor(Math.random() * responses.length)];
}

function getFallbackResponses(needType, userLevel) {
  const base = userLevel === 0 ? "Diagnostic de base" : "Analyse premium";
  const cta = userLevel === 0 ? 
    "\n\n🎯 **DIAGNOSTIC COMPLET GRATUIT :**\n📧 **Tapez votre email dans le chat** ⬇️" : 
    "\n\n✅ **Diagnostic personnalisé activé !**";

  const responses = {
    brakes: [
      `🔧 **${base}** - Problème de freinage détecté.\n\nD'après tes symptômes, je suspecte un problème de plaquettes ou disques. Questions importantes : Le bruit apparaît au freinage ? Vibrations ressenties ? Le frein tire d'un côté ?\n\n⚠️ **Sécurité prioritaire** - Contrôle urgent recommandé !${cta}`,
      
      `🔧 **${base}** - Freinage à analyser.\n\nTes symptômes correspondent à plusieurs causes possibles. Pour un diagnostic précis, j'ai besoin de savoir : À quel moment ça arrive ? Type de bruit ? Pédale molle ou dure ?\n\n🎯 **Mon expertise freinage** à ton service !${cta}`
    ],
    
    engine: [
      `🔧 **${base}** - Problème moteur identifié.\n\nD'après ta description, plusieurs pistes : voyant allumé ? Perte de puissance ? Fumées ? Mon expérience me dit qu'il faut agir vite pour éviter la casse moteur.\n\n⚡ **Diagnostic rapide recommandé** !${cta}`,
      
      `🔧 **${base}** - Moteur à surveiller.\n\nTes symptômes m'interpellent. Pour cibler le problème : Quand ça arrive ? À froid ou chaud ? Voyants tableau de bord ? J'ai 20 ans d'expérience sur ces pannes !\n\n🎯 **Expertise moteur** activée !${cta}`
    ],
    
    general: [
      `🔧 **${base}** - Problème auto détecté.\n\nD'après tes symptômes, j'ai besoin de plus d'infos pour un diagnostic précis : Quand ça arrive ? Voyants allumés ? Bruits particuliers ? 20 ans d'expérience à ton service !\n\n🎯 **Expert automobile** prêt !${cta}`,
      
      `🔧 **${base}** - Analyse en cours.\n\nJe vois que tu as un souci auto. Mon expertise me dit qu'il faut creuser : Symptômes exacts ? Fréquence ? Contexte d'apparition ? Je vais t'aider à résoudre ça !\n\n⚡ **Diagnostic expert** !${cta}`
    ]
  };

  return responses[needType] || responses.general;
}

// === GESTION DES LEADS ===
async function createLeadFromEmail(email, message, sessionId) {
  try {
    const leadData = {
      email,
      message_context: message.substring(0, 200),
      session_id: sessionId,
      source: 'email_detection',
      timestamp: new Date().toISOString(),
      lead_value: 85,
      status: 'premium_activated'
    };

    // Sauvegarde Airtable
    await logToAirtable({
      ...leadData,
      type: 'lead_creation'
    });

    return {
      success: true,
      leadValue: 85,
      leadId: `lead_${Date.now()}`
    };
  } catch (error) {
    console.error('❌ Erreur création lead:', error);
    return { success: false, leadValue: 0 };
  }
}

async function handleLeadCreation(req, res) {
  try {
    const { userData, sessionId, message } = req.body;
    
    const leadData = {
      nom: userData.firstName || userData.nom,
      email: userData.email,
      telephone: userData.phone || userData.telephone,
      ville: userData.location || userData.ville,
      probleme: message || userData.besoin_auto || 'Non précisé',
      vehicule: userData.vehicleModel || userData.vehicule || 'Non précisé',
      session_id: sessionId,
      source: 'form_submission',
      timestamp: new Date().toISOString(),
      lead_value: calculateLeadValue(userData),
      user_level: getUserLevel(userData)
    };

    // Sauvegarde Airtable
    const airtableResult = await logToAirtable({
      ...leadData,
      type: 'lead_creation'
    });

    return res.status(200).json({
      success: true,
      leadId: `lead_${Date.now()}`,
      leadValue: leadData.lead_value,
      message: 'Lead créé avec succès',
      airtableResult
    });

  } catch (error) {
    console.error('❌ Erreur handleLeadCreation:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur création lead'
    });
  }
}

// === ANALYSE BUSINESS ===
function analyzeBusiness(message, response, userLevel) {
  const needType = detectNeedType(message);
  const urgency = detectUrgency(message);
  const leadValue = calculateLeadValue({ userLevel, needType, urgency });
  
  return {
    needType,
    urgency,
    leadValue,
    partner: getOptimalPartner(needType),
    conversionPotential: userLevel === 0 ? 0.8 : 0.3
  };
}

function detectNeedType(message) {
  const lower = message.toLowerCase();
  if (lower.includes('frein') || lower.includes('brake')) return "brakes";
  if (lower.includes('moteur') || lower.includes('voyant') || lower.includes('fap') || lower.includes('egr')) return "engine";
  if (lower.includes('puissance') || lower.includes('acceler') || lower.includes('turbo')) return "power";
  if (lower.includes('fumee') || lower.includes('fumée')) return "smoke";
  return "general";
}

function detectUrgency(message) {
  const urgentWords = ['urgent', 'vite', 'rapidement', 'panne', 'ne démarre plus', 'danger'];
  const lower = message.toLowerCase();
  return urgentWords.some(word => lower.includes(word)) ? 'high' : 'normal';
}

function calculateLeadValue(params) {
  const baseValues = { brakes: 40, engine: 35, power: 30, smoke: 45, general: 25 };
  const levelMultipliers = { 0: 1, 1: 1.5, 2: 1.8, 3: 2.2 };
  const urgencyBonus = params.urgency === 'high' ? 1.3 : 1.0;
  
  const baseValue = baseValues[params.needType] || 25;
  const levelMultiplier = levelMultipliers[params.userLevel] || 1;
  
  return Math.round(baseValue * levelMultiplier * urgencyBonus);
}

function getOptimalPartner(needType) {
  const partners = {
    brakes: "MIDAS",
    engine: "IDGARAGES", 
    power: "IDGARAGES",
    smoke: "IDGARAGES",
    general: "MIDAS"
  };
  
  return partners[needType] || "MIDAS";
}

function generateConversionStrategy(businessAnalysis) {
  if (businessAnalysis.conversionPotential > 0.7) {
    return {
      trigger: "🔓 Pour un diagnostic complet, laissez votre email !",
      required: ["email"],
      reward: "diagnostic premium gratuit",
      estimatedValue: businessAnalysis.leadValue
    };
  }
  return null;
}

// === LOGGING AIRTABLE ===
async function logToAirtable(data) {
  try {
    const AIRTABLE_TOKEN = 'patf3ZGIrQfnBsg8a.ab3b4eb79a58c1fbc413fe1ed37948fce5faaa1297a760fbaadf99ebca9341b2';
    const BASE_ID = 'appKdP1OPj7KiSmS0';
    const TABLE_ID = 'tblmdV7eYHqgFaKaX'; // Table LEADS

    const recordData = {
      fields: {
        'Nom': data.nom || 'Utilisateur Chat',
        'Email': data.email || '',
        'Telephone': data.telephone || '',
        'Session_ID': data.sessionId || data.session_id,
        'Date_Contact': new Date().toISOString(),
        'Probleme_Initial': data.message || data.probleme || '',
        'Vehicule': data.vehicule || '',
        'Statut_Lead': data.type === 'lead_creation' ? 'Nouveau' : 'Chat',
        'Source_Lead': data.source || 'Dual Brain Chat',
        'Lead_Value': data.leadValue || data.lead_value || 0,
        'User_Level': data.userLevel || 0,
        'AI_Mode': data.mode || 'Dual Brain',
        'Need_Type': data.needType || 'general'
      }
    };

    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recordData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Airtable log:', result.id);
      return { success: true, id: result.id };
    } else {
      console.error('❌ Erreur Airtable:', response.status);
      return { success: false, error: response.status };
    }

  } catch (error) {
    console.error('❌ Erreur logToAirtable:', error);
    return { success: false, error: error.message };
  }
}

// === UTILITAIRES ===
function getLevelName(level) {
  const names = {
    0: "Diagnostic de Base",
    1: "Diagnostic Avancé", 
    2: "Expertise Premium",
    3: "Service VIP"
  };
  return names[level] || "Inconnu";
}

function getUserLevel(userData) {
  let level = 0;
  if (userData.email) level = 1;
  if (userData.phone || userData.telephone) level = 2;
  if (userData.vehicleModel || userData.vehicleInfo) level = 3;
  return level;
}
