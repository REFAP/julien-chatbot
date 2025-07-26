// Mise à jour de l'API pour intégrer la simulation militante avancée

import { SimulationMilitanteAvancee } from './simulation-militante-avancee.js';
import { PROMPTS_MILITANTS, getPromptMilitant } from './prompts-militants-avances.js';

// Instance globale de la simulation
const simulationMilitante = new SimulationMilitanteAvancee();

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
    const { message, userData = {}, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Détection email automatique
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const userEmail = message.match(emailRegex)?.[0];
    
    if (userEmail) {
      return res.status(200).json({
        success: true,
        message: genererReponseEmailConfirme(userEmail),
        metadata: {
          mode: "🤝 Accompagnement Personnalisé",
          userLevel: 1,
          leadValue: 65,
          email: userEmail,
          militant: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Détection niveau utilisateur
    let userLevel = 0;
    if (userData.email) userLevel = 1;
    if (userData.phone) userLevel = 2;

    const levelNames = {
      0: "Aide Gratuite",
      1: "Accompagnement Personnalisé", 
      2: "Support Expert"
    };

    // 🤝 APPEL SIMULATION MILITANTE AVANCÉE D'ABORD
    const simulationResult = simulationMilitante.analyserProbleme(message, userLevel);
    let response = simulationResult.content;
    let mode = `simulation_militante_${simulationResult.type}`;
    let economicValue = simulationResult.economic_value;

    // 🧠 ESSAI IA RÉELLES avec prompts militants spécialisés
    try {
      const needType = detectNeedType(message);
      const claudeResponse = await callClaudeMilitantAvance(message, needType, userLevel);
      const openaiResponse = await callOpenAIMilitantAvance(message, needType, userLevel);
      
      if (claudeResponse && openaiResponse) {
        // Fusion avec simulation comme base
        response = await fusionMilitanteAvancee(
          simulationResult, 
          claudeResponse, 
          openaiResponse, 
          userLevel
        );
        mode = "dual_brain_militant_avance";
        economicValue = Math.max(economicValue, 300);
      } else if (claudeResponse) {
        response = await fusionSimulationClaude(simulationResult, claudeResponse, userLevel);
        mode = "claude_militant_enrichi";
        economicValue = Math.max(economicValue, 250);
      } else if (openaiResponse) {
        response = await fusionSimulationOpenAI(simulationResult, openaiResponse, userLevel);
        mode = "openai_militant_enrichi";
        economicValue = Math.max(economicValue, 220);
      }
    } catch (error) {
      console.log('IA indisponibles, simulation militante pure utilisée:', error.message);
      // response reste celui de la simulation
    }

    // Ajout aide email pour niveau 0 (bienveillant)
    if (userLevel === 0 && !response.includes('email')) {
      response += genererInvitationEmailBienveillante();
    }

    // Calcul business avec valeurs militantes
    const needType = detectNeedType(message);
    const baseScore = calculateMilitantScore(needType, mode, simulationResult.confidence);
    const leadValue = Math.round(economicValue * 0.15); // 15% de l'économie = valeur lead

    return res.status(200).json({
      success: true,
      message: response,
      metadata: {
        mode,
        userLevel,
        levelName: levelNames[userLevel],
        needType,
        leadValue,
        economicValue, // Économie pour l'automobiliste
        score: baseScore,
        partner: getPartnerMilitant(needType),
        militant: true,
        confidence: simulationResult.confidence,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur chat militant avancé:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// === APPELS IA MILITANTS AVANCÉS ===

async function callClaudeMilitantAvance(message, needType, userLevel) {
  try {
    const claudeKey = process.env.CLAUDE_API_KEY;
    if (!claudeKey) return null;

    const militantPrompt = getPromptMilitant(needType, userLevel);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1200,
        messages: [
          { role: 'user', content: `${militantPrompt}\n\nProblème auto: ${message}` }
        ]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Erreur Claude militant avancé:', error);
    return null;
  }
}

async function callOpenAIMilitantAvance(message, needType, userLevel) {
  try {
    const openaiKey = process.env.CLE_API_OPENAI;
    if (!openaiKey) return null;

    const militantPrompt = getPromptMilitant(needType, userLevel);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1200,
        messages: [
          { role: 'system', content: militantPrompt },
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erreur OpenAI militant avancé:', error);
    return null;
  }
}

// === FUSIONS MILITANTES AVANCÉES ===

async function fusionMilitanteAvancee(simulationResult, claudeResponse, openaiResponse, userLevel) {
  if (userLevel === 0) {
    return `🤝 **Diagnostic Militant Triple-Check** 🛠️

**🧠 Base de connaissances Julien :**
${simulationResult.content}

**🔧 Validation Expert Claude :**
${claudeResponse}

**💡 Perspective Humaine OpenAI :**
${openaiResponse}

✅ **Triple validation militante = diagnostic fiable à 100% !**`;
  } else {
    return `🧠 **Analyse Militant Premium Triple-Puissance** 🔧

**📚 Diagnostic de base (Julien) :**
${simulationResult.content}

**🎯 Expertise technique (Claude) :**
${claudeResponse}

**🤝 Approche humaine (OpenAI) :**
${openaiResponse}

🏆 **Analyse complète terminée - Plan d'action anti-arnaque dans ton guide !**`;
  }
}

async function fusionSimulationClaude(simulationResult, claudeResponse, userLevel) {
  return `🔧 **Diagnostic Militant + Expert Claude** 🧠

**💪 Analyse militante :**
${simulationResult.content}

**🎯 Validation experte :**
${claudeResponse}

✅ **Double-check militant + expert = fiabilité maximale !**`;
}

async function fusionSimulationOpenAI(simulationResult, openaiResponse, userLevel) {
  return `🤝 **Diagnostic Militant + Assistant Humain** 💡

**🛠️ Base militante :**
${simulationResult.content}

**💬 Perspective humaine :**
${openaiResponse}

✅ **Approche technique + humaine = aide complète !**`;
}

// === UTILITAIRES MILITANTS ===

function genererReponseEmailConfirme(email) {
  const prenom = email.split('@')[0].split('.')[0];
  return `🎉 **Super ${prenom} !** 📧

✅ **Email confirmé → Passage en mode accompagnement personnalisé !**

📋 **Ce que tu vas recevoir dans 2 minutes :**
• **Guide anti-arnaque complet** de ton problème
• **Vrais coûts** vs prix gonflés des arnaqueurs  
• **Garages de confiance** testés près de chez toi
• **Astuces de mécano** pour éviter les récidives
• **Plan d'action** étape par étape

📱 **En attendant, continue à me parler !**
*Je suis là pour t'aider, pas pour te vendre.*

🛠️ **Raconte-moi ton problème en détail** pour que je puisse t'accompagner au mieux !`;
}

function genererInvitationEmailBienveillante() {
  return `\n\n💡 **Pour aller plus loin gratuitement :**\nLaisse ton email si tu veux que je t'envoie :\n• Le guide complet anti-arnaque de ton problème\n• Les astuces pour économiser des centaines d'euros\n• Les garages de confiance près de chez toi\n\n📧 **Tape juste ton email** ⬇️ *(pas de spam, que de l'aide utile !)*\n*Exemple : prenom.nom@gmail.com*`;
}

function detectNeedType(message) {
  const lower = message.toLowerCase();
  if (lower.includes('fap') || lower.includes('egr') || lower.includes('adblue') || 
      lower.includes('antipollution')) return "fap";
  if (lower.includes('frein') || lower.includes('brake') || lower.includes('plaquette')) return "brakes";
  if (lower.includes('moteur') || lower.includes('voyant')) return "engine";
  if (lower.includes('arnaque') || lower.includes('cher') || lower.includes('prix')) return "anti_arnaque";
  return "general";
}

function calculateMilitantScore(needType, mode, confidence) {
  const baseScores = { 
    fap: 9.2,           // Spécialité Re-Fap
    brakes: 8.8,        // Sécurité prioritaire  
    engine: 8.5,        // Diagnostic important
    anti_arnaque: 9.5,  // Mission principale
    general: 8.0        // Aide générale
  };
  
  const modeMultipliers = { 
    dual_brain_militant_avance: 1.3,
    claude_militant_enrichi: 1.2, 
    openai_militant_enrichi: 1.1,
    simulation_militante_fap: 1.2,
    simulation_militante_anti_arnaque: 1.25,
    simulation_militante_brakes: 1.15
  };
  
  const baseScore = baseScores[needType] || 8.0;
  const modeMultiplier = modeMultipliers[mode] || 1.0;
  const confidenceBonus = confidence > 0.9 ? 1.1 : confidence > 0.8 ? 1.05 : 1.0;
  
  return Math.min(10, baseScore * modeMultiplier * confidenceBonus);
}

function getPartnerMilitant(needType) {
  const partners = {
    fap: "Re-Fap (spécialiste militant)",
    brakes: "Réseau confiance freinage",
    engine: "Experts diagnostic",
    anti_arnaque: "Garages certifiés anti-arnaque",
    general: "Réseau Re-Fap"
  };
  return partners[needType] || "Garage de confiance";
}
