// api/chat-dual-brain.js - Version avec CTA email optimisé et capture automatique

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
    // Détecter si l'utilisateur a fourni un email
    const { message, userData = {}, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const userEmail = message.match(emailRegex)?.[0];
    
    if (userEmail) {
      // Email détecté = upgrade automatique vers premium gratuit
      return res.status(200).json({
        success: true,
        message: `🎉 **EMAIL CONFIRMÉ : ${userEmail}** 🎉\n\n` +
          `✅ **DIAGNOSTIC PREMIUM GRATUIT ACTIVÉ !**\n\n` +
          `📧 **Votre rapport détaillé sera envoyé dans 2 minutes à :**\n` +
          `${userEmail}\n\n` +
          `🚀 **Diagnostic en cours de génération...**\n` +
          `• Analyse technique approfondie de votre problème de freinage\n` +
          `• Estimation précise des coûts (plaquettes, disques, main d'œuvre)\n` +
          `• Guide de réparation avec photos étape par étape\n` +
          `• Liste de garages recommandés dans votre région\n` +
          `• Conseils anti-arnaque pour négocier\n\n` +
          `📱 **Vérifiez votre boîte mail dans 2 minutes !**\n` +
          `*Pensez à vérifier vos spams si besoin*\n\n` +
          `🎁 **BONUS :** Vous recevrez aussi nos alertes rappels constructeurs !`,
        metadata: {
          mode: "🎁 Email Premium Activé",
          userLevel: 1,
          leadValue: 85,
          email: userEmail,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Détection niveau utilisateur
    let userLevel = 0;
    if (userData.email) userLevel = 1;
    if (userData.phone) userLevel = 2;
    if (userData.vehicleInfo) userLevel = 3;

    const levelNames = {
      0: "Diagnostic de Base",
      1: "Diagnostic Avancé", 
      2: "Expertise Premium",
      3: "Service VIP"
    };

    // Appel Dual Brain avec dialogue direct
    let response = "";
    let mode = "simulation_intelligent";
    
    // Essai Claude + OpenAI (Dual Brain réel)
    try {
      const claudeResponse = await callClaude(message, userLevel);
      const openaiResponse = await callOpenAI(message, userLevel);
      
      if (claudeResponse && openaiResponse) {
        // FUSION INTELLIGENTE pour dialogue direct
        response = await fusionDualBrain(message, claudeResponse, openaiResponse, userLevel);
        mode = "dual_brain_real";
      } else if (claudeResponse) {
        response = await formatClaudeResponse(message, claudeResponse, userLevel);
        mode = "claude_real";
      } else if (openaiResponse) {
        response = await formatOpenAIResponse(message, openaiResponse, userLevel);
        mode = "openai_real";
      }
    } catch (error) {
      console.log('APIs échouent, utilisation mode intelligent:', error.message);
    }

    // Fallback intelligent avec dialogue direct
    if (!response) {
      response = await simulationIntelligente(message, userLevel);
      mode = "simulation_intelligent";
    }

    // Ajout du CTA email pour niveau 0
    if (userLevel === 0) {
      response += `\n\n🎁 **DIAGNOSTIC PREMIUM GRATUIT** 🎁\n`;
      response += `**Obtenez IMMÉDIATEMENT votre rapport complet :**\n`;
      response += `✅ Diagnostic précis spécifique à votre véhicule\n`;
      response += `✅ Estimation exacte des coûts de réparation\n`;
      response += `✅ Guide de réparation détaillé\n`;
      response += `✅ Conseils pour éviter l'arnaque garage\n\n`;
      response += `📧 **TAPEZ VOTRE EMAIL DANS LE CHAT** ⬇️\n`;
      response += `*Exemple : votre.email@gmail.com*\n`;
      response += `⚡ **Rapport envoyé automatiquement en 2 minutes !**\n`;
      response += `\n💡 **BONUS :** Alertes rappels constructeurs + conseils experts gratuits !`;
    }

    // Calcul business
    const needType = detectNeedType(message);
    const baseScore = calculateScore(needType, mode);
    const leadValue = calculateLeadValue(needType, userLevel, mode);

    // Logging Airtable
    await logToAirtable({
      message,
      response,
      userLevel,
      leadValue,
      mode,
      needType,
      sessionId
    });

    return res.status(200).json({
      success: true,
      message: response,
      metadata: {
        mode,
        userLevel,
        levelName: levelNames[userLevel],
        needType,
        leadValue,
        score: baseScore,
        partner: needType === "brakes" ? "MIDAS" : "IDGARAGES",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur chat-dual-brain:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// === APPELS APIs ===
async function callClaude(message, userLevel) {
  try {
    const claudeKey = process.env.CLAUDE_API_KEY;
    if (!claudeKey) return null;

    const systemPrompt = `Tu es Julien, expert automobile FAP/EGR/AdBlue. Réponds directement et précisément à la question posée.
    
    Niveau utilisateur: ${userLevel}
    - Niveau 0: Diagnostic de base + invitation email pour plus de détails
    - Niveau 1+: Diagnostic complet avec estimations de coûts
    
    Style: Expert technique mais accessible, questions pertinentes pour approfondir le diagnostic.`;

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
    console.error('Erreur Claude:', error);
    return null;
  }
}

async function callOpenAI(message, userLevel) {
  try {
    const openaiKey = process.env.CLE_API_OPENAI;
    if (!openaiKey) return null;

    const systemPrompt = `Tu es un assistant conversationnel expert en automobile. Réponds de manière engageante et persuasive à la question posée.
    
    Niveau utilisateur: ${userLevel}
    - Niveau 0: Encourage à donner email pour diagnostic complet
    - Niveau 1+: Sois très détaillé et expert
    
    Style: Chaleureux, rassurant, expert en conversion client.`;

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
    console.error('Erreur OpenAI:', error);
    return null;
  }
}

// === FUSION DUAL BRAIN ===
async function fusionDualBrain(message, claudeResponse, openaiResponse, userLevel) {
  // Fusion intelligente des deux réponses
  const needType = detectNeedType(message);
  
  if (userLevel === 0) {
    return `🔧 **Diagnostic Dual Brain Activé** 🧠\n\n${claudeResponse}\n\n💡 **Expertise Complémentaire:**\n${openaiResponse}`;
  } else {
    return `🧠 **Analyse Dual Brain Premium** 🔧\n\n**Diagnostic Technique (Claude):**\n${claudeResponse}\n\n**Analyse Complémentaire (OpenAI):**\n${openaiResponse}\n\n✅ **Diagnostic complet terminé !**`;
  }
}

async function formatClaudeResponse(message, claudeResponse, userLevel) {
  if (userLevel === 0) {
    return `🔧 **Diagnostic Claude Activé** \n\n${claudeResponse}`;
  } else {
    return `🧠 **Analyse Claude Premium** 🔧\n\n${claudeResponse}`;
  }
}

async function formatOpenAIResponse(message, openaiResponse, userLevel) {
  if (userLevel === 0) {
    return `🤖 **Diagnostic OpenAI Activé** \n\n${openaiResponse}`;
  } else {
    return `🤖 **Analyse OpenAI Premium** 🔧\n\n${openaiResponse}`;
  }
}

// === SIMULATION INTELLIGENTE ===
async function simulationIntelligente(message, userLevel) {
  const needType = detectNeedType(message);
  const lowerMessage = message.toLowerCase();
  
  let baseResponse = "";
  
  // Réponses directes et intelligentes selon le problème
  if (needType === "brakes") {
    if (userLevel === 0) {
      baseResponse = `🔧 **Diagnostic Freinage** 🚗\n\nD'après ta description "${message}", je détecte un problème de freinage qui nécessite une attention immédiate.\n\n**Questions importantes :**\n• Le bruit apparaît-il au freinage ou en roulant ?\n• Est-ce un grincement, un couinement ou un bruit métallique ?\n• Le frein tire-t-il d'un côté ?\n\n⚠️ **Sécurité prioritaire** : Les freins sont un élément vital, un contrôle rapide est recommandé.\n\n🎯 **POUR VOTRE DIAGNOSTIC COMPLET GRATUIT :**\n📧 **Tapez simplement votre email dans le chat** ⬇️\n*Exemple : votre.nom@gmail.com*\n\n⚡ **Vous recevrez automatiquement :**\n• Analyse précise de votre problème\n• Estimation exacte des coûts\n• Guide photos étape par étape\n• Garages recommandés près de chez vous`;
    } else {
      baseResponse = `🧠 **Diagnostic Freinage Premium** 🔧\n\nAnalyse de "${message}" :\n\n**Causes probables :**\n• Plaquettes usées (80% des cas) - 120-250€\n• Disques voilés (15% des cas) - 200-400€ \n• Étriers grippés (5% des cas) - 150-300€\n\n**Diagnostic immédiat recommandé** - La sécurité avant tout !\n\n✅ **Estimation moyenne : 150-300€** selon l'intervention nécessaire.`;
    }
  } 
  else if (needType === "engine") {
    if (lowerMessage.includes("voyant")) {
      if (userLevel === 0) {
        baseResponse = `🔧 **Diagnostic Voyant Moteur** ⚠️\n\nVoyant moteur détecté dans "${message}".\n\n**Questions essentielles :**\n• Quelle couleur ? (Orange/Rouge)\n• Il clignote ou reste fixe ?\n• Depuis combien de temps ?\n• Perte de puissance ressentie ?\n\n**Diagnostic nécessaire** - Le voyant indique un dysfonctionnement à identifier.\n\n🎯 **DIAGNOSTIC COMPLET GRATUIT :**\n📧 **Tapez votre email dans le chat** ⬇️\n*Exemple : votre.nom@gmail.com*`;
      } else {
        baseResponse = `🧠 **Analyse Voyant Moteur Premium** ⚠️\n\nAnalyse de "${message}" :\n\n**Si orange fixe :** Pollution/FAP (60%) - 150-400€\n**Si orange clignotant :** Allumage/injection (25%) - 100-250€\n**Si rouge :** Urgence moteur (15%) - 200-800€\n\n**Action immédiate :** Diagnostic OBD obligatoire pour identifier le code défaut exact.\n\n✅ **Diagnostic OBD : 60-80€** + intervention selon code défaut.`;
      }
    } else if (lowerMessage.includes("fap") || lowerMessage.includes("egr")) {
      if (userLevel === 0) {
        baseResponse = `🔧 **Diagnostic FAP/EGR** 🌪️\n\nProblème FAP/EGR détecté dans "${message}".\n\n**Symptômes à préciser :**\n• Voyant anti-pollution allumé ?\n• Perte de puissance ?\n• Fumée noire à l'échappement ?\n• Type de conduite (ville/route) ?\n\n**Mon expertise** : FAP/EGR sont ma spécialité Re-Fap !\n\n🎯 **DIAGNOSTIC FAP/EGR GRATUIT :**\n📧 **Tapez votre email dans le chat** ⬇️\n*Exemple : votre.nom@gmail.com*`;
      } else {
        baseResponse = `🧠 **Expertise FAP/EGR Premium** 🌪️\n\nAnalyse spécialisée de "${message}" :\n\n**Solutions FAP/EGR :**\n• Régénération forcée - 80-120€\n• Nettoyage FAP/EGR - 150-250€\n• Remplacement FAP - 800-1500€\n• Reprogrammation légale - 400-600€\n\n**Ma recommandation** : Diagnostic approfondi pour solution optimale.\n\n✅ **Spécialiste Re-Fap** - Solutions sur-mesure selon ton usage !`;
      }
    }
  }
  else if (needType === "power") {
    if (userLevel === 0) {
      baseResponse = `🔧 **Diagnostic Perte Puissance** ⚡\n\nPerte de puissance détectée dans "${message}".\n\n**À préciser :**\n• Perte progressive ou brutale ?\n• À chaud ou à froid ?\n• Voyants allumés ?\n• Fumée d'échappement ?\n\n**Causes multiples possibles** - Diagnostic nécessaire pour cibler.\n\n🎯 **DIAGNOSTIC COMPLET GRATUIT :**\n📧 **Tapez votre email dans le chat** ⬇️\n*Exemple : votre.nom@gmail.com*`;
    } else {
      baseResponse = `🧠 **Analyse Perte Puissance Premium** ⚡\n\nAnalyse de "${message}" :\n\n**Causes fréquentes :**\n• Turbo défaillant (40%) - 500-1200€\n• Injection/allumage (30%) - 150-400€\n• FAP colmaté (20%) - 150-300€\n• Capteurs HS (10%) - 80-200€\n\n**Diagnostic prioritaire** pour cibler l'intervention.\n\n✅ **Estimation : 150-1200€** selon la cause identifiée.`;
    }
  }
  else {
    if (userLevel === 0) {
      baseResponse = `🔧 **Diagnostic Auto Général** 🚗\n\nAnalyse de "${message}".\n\n**Pour un diagnostic précis, j'ai besoin de plus d'infos :**\n• Symptômes exacts ?\n• Quand ça arrive ?\n• Voyants allumés ?\n• Bruits particuliers ?\n\n**Expert automobile** prêt à t'aider !\n\n🎯 **DIAGNOSTIC COMPLET GRATUIT :**\n📧 **Tapez votre email dans le chat** ⬇️\n*Exemple : votre.nom@gmail.com*`;
    } else {
      baseResponse = `🧠 **Diagnostic Auto Premium** 🔧\n\nAnalyse approfondie de "${message}" :\n\n**Méthodologie experte :**\n• Identification symptômes\n• Diagnostic différentiel\n• Estimation coûts\n• Solutions optimales\n\n**Mon expertise** à ton service pour résoudre ton problème !\n\n✅ **Diagnostic personnalisé** selon tes symptômes précis.`;
    }
  }
  
  return baseResponse;
}

// === FONCTIONS UTILITAIRES ===
function detectNeedType(message) {
  const lower = message.toLowerCase();
  if (lower.includes('frein') || lower.includes('brake')) return "brakes";
  if (lower.includes('moteur') || lower.includes('voyant') || lower.includes('fap') || lower.includes('egr')) return "engine";
  if (lower.includes('puissance') || lower.includes('acceler') || lower.includes('turbo')) return "power";
  if (lower.includes('fumee') || lower.includes('fumée')) return "smoke";
  return "general";
}

function calculateScore(needType, mode) {
  const baseScores = { brakes: 8.5, engine: 8.0, power: 7.8, smoke: 8.2, general: 7.5 };
  const modeMultipliers = { dual_brain_real: 1.2, claude_real: 1.1, openai_real: 1.0, simulation_intelligent: 0.9 };
  return Math.min(10, (baseScores[needType] || 7.5) * (modeMultipliers[mode] || 1.0));
}

function calculateLeadValue(needType, userLevel, mode) {
  const baseValues = { brakes: 40, engine: 35, power: 30, smoke: 45, general: 25 };
  const levelMultipliers = { 0: 1, 1: 1.5, 2: 1.8, 3: 2.2 };
  const modeBonus = mode === "dual_brain_real" ? 1.2 : mode.includes("real") ? 1.1 : 1.0;
  
  return Math.round((baseValues[needType] || 25) * (levelMultipliers[userLevel] || 1) * modeBonus);
}

async function logToAirtable(data) {
  try {
    // Simulation du logging Airtable
    console.log('Airtable Log:', {
      message: data.message.substring(0, 50),
      userLevel: data.userLevel,
      leadValue: data.leadValue,
      mode: data.mode,
      timestamp: data.sessionId
    });
  } catch (error) {
    console.error('Erreur Airtable logging:', error);
  }
}
