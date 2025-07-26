// api/chat-dual-brain.js - Version Militante Debuggée

export default async function handler(req, res) {
  // Configuration CORS stricte
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Méthode non autorisée - Utilisez POST' 
    });
  }

  console.log('🤝 API Militante appelée:', req.method);

  try {
    const { message, userData = {}, sessionId } = req.body || {};
    
    console.log('📝 Message reçu:', message?.substring(0, 50));
    
    if (!message) {
      return res.status(400).json({ 
        success: false,
        error: 'Message requis' 
      });
    }

    // Détection email automatique
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const userEmail = message.match(emailRegex)?.[0];
    
    if (userEmail) {
      console.log('📧 Email détecté:', userEmail);
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

    console.log('👤 User level:', userLevel);

    const levelNames = {
      0: "Aide Gratuite",
      1: "Accompagnement Personnalisé", 
      2: "Support Expert"
    };

    // Appel simulation militante
    let response = "";
    let mode = "simulation_militante";
    let economicValue = 200;
    
    try {
      // Essai appels IA
      const claudeResponse = await callClaudeMilitant(message, userLevel);
      const openaiResponse = await callOpenAIMilitant(message, userLevel);
      
      if (claudeResponse && openaiResponse) {
        response = await fusionMilitante(message, claudeResponse, openaiResponse, userLevel);
        mode = "dual_brain_militant";
        economicValue = 300;
      } else if (claudeResponse) {
        response = formatClaudeMilitant(claudeResponse, userLevel);
        mode = "claude_militant";
        economicValue = 250;
      } else if (openaiResponse) {
        response = formatOpenAIMilitant(openaiResponse, userLevel);
        mode = "openai_militant";
        economicValue = 220;
      } else {
        throw new Error('APIs indisponibles');
      }
    } catch (apiError) {
      console.log('⚡ APIs indisponibles, simulation militante:', apiError.message);
      // Simulation militante de fallback
      response = await simulationMilitanteIntelligente(message, userLevel);
      mode = "simulation_militante";
      economicValue = 200;
    }

    // Ajout aide email pour niveau 0
    if (userLevel === 0 && !response.includes('email')) {
      response += genererInvitationEmailBienveillante();
    }

    // Calcul business militant
    const needType = detectNeedType(message);
    const baseScore = calculateMilitantScore(needType, mode);
    const leadValue = Math.round(economicValue * 0.15);

    console.log('✅ Réponse générée:', mode, 'Score:', baseScore);

    return res.status(200).json({
      success: true,
      message: response,
      metadata: {
        mode,
        userLevel,
        levelName: levelNames[userLevel],
        needType,
        leadValue,
        economicValue,
        score: baseScore,
        partner: getPartnerMilitant(needType),
        militant: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Erreur API militante:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur temporaire',
      fallback: "Salut ! C'est Julien, ton mécano militant ! 🛠️\n\nPetit souci technique, mais je peux t'aider quand même !\n\nDécris-moi ton problème auto... 💪",
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// === APPELS IA MILITANTS ===

async function callClaudeMilitant(message, userLevel) {
  try {
    const claudeKey = process.env.CLAUDE_API_KEY;
    if (!claudeKey) {
      console.log('🔑 CLAUDE_API_KEY manquante');
      return null;
    }

    const militantPrompt = `Tu es Julien, mécano digital MILITANT depuis 20 ans chez Re-Fap.

🎯 MISSION : Aider les automobilistes contre les arnaques !

TON MILITANT :
- "Je suis là pour t'aider, pas pour vendre"
- Solutions économiques prioritaires
- Anti-arnaque systématique
- Ton chaleureux et bienveillant

NIVEAU ${userLevel} : ${userLevel === 0 ? "Aide gratuite" : "Accompagnement approfondi"}

Réponds comme un vrai mécano militant qui veut vraiment aider.`;

    console.log('🔵 Appel Claude...');

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
          { role: 'user', content: `${militantPrompt}\n\nProblème auto: ${message}` }
        ]
      })
    });

    if (!response.ok) {
      console.log('❌ Claude error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('✅ Claude success');
    return data.content[0].text;

  } catch (error) {
    console.error('❌ Erreur Claude:', error.message);
    return null;
  }
}

async function callOpenAIMilitant(message, userLevel) {
  try {
    const openaiKey = process.env.CLE_API_OPENAI;
    if (!openaiKey) {
      console.log('🔑 CLE_API_OPENAI manquante');
      return null;
    }

    const militantPrompt = `Tu es un assistant mécano militant et engagé. Tu défends les automobilistes contre les arnaques.

PHILOSOPHIE : 
- Anti-arnaque systématique
- Solutions économiques prioritaires  
- Éducation des automobilistes
- Ton chaleureux et bienveillant

NIVEAU ${userLevel} : ${userLevel === 0 ? "Aide gratuite" : "Accompagnement approfondi"}

Réponds avec empathie et expertise, toujours du côté de l'automobiliste.`;

    console.log('🟠 Appel OpenAI...');

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
          { role: 'system', content: militantPrompt },
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) {
      console.log('❌ OpenAI error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('✅ OpenAI success');
    return data.choices[0].message.content;

  } catch (error) {
    console.error('❌ Erreur OpenAI:', error.message);
    return null;
  }
}

// === FUSIONS ET FORMATAGE ===

async function fusionMilitante(message, claudeResponse, openaiResponse, userLevel) {
  if (userLevel === 0) {
    return `🔧 **Diagnostic Militant Dual Brain** 🛠️

${claudeResponse}

💡 **Perspective complémentaire :**
${openaiResponse}

🤝 **Je suis là pour t'aider, pas pour te vendre !**`;
  } else {
    return `🧠 **Accompagnement Expert Dual Brain** 🔧

**🎯 Diagnostic Technique :**
${claudeResponse}

**💡 Approche Humaine :**
${openaiResponse}

✅ **Analyse complète terminée - Solutions anti-arnaque prêtes !**`;
  }
}

function formatClaudeMilitant(claudeResponse, userLevel) {
  if (userLevel === 0) {
    return `🔧 **Diagnostic Gratuit Claude** 🛠️\n\n${claudeResponse}`;
  } else {
    return `🧠 **Accompagnement Expert Claude** 🔧\n\n${claudeResponse}`;
  }
}

function formatOpenAIMilitant(openaiResponse, userLevel) {
  if (userLevel === 0) {
    return `🤝 **Aide Militante OpenAI** 🛠️\n\n${openaiResponse}`;
  } else {
    return `💡 **Support Personnalisé OpenAI** 🔧\n\n${openaiResponse}`;
  }
}

// === SIMULATION MILITANTE INTELLIGENTE ===

async function simulationMilitanteIntelligente(message, userLevel) {
  const needType = detectNeedType(message);
  const lowerMessage = message.toLowerCase();
  
  let baseResponse = "";
  
  if (needType === "fap") {
    if (userLevel === 0) {
      baseResponse = `🌪️ **Diagnostic FAP Militant** 🌪️

OK, ça sent le FAP bien bouché ! Tu fais beaucoup de petits trajets ?

**Bonne nouvelle :** Contrairement à ce qu'on va sûrement te dire au garage, PAS BESOIN de le remplacer !

**La vérité vraie :**
• Nettoyage FAP : 200€ max ✅
• Remplacement FAP : 2000€ ❌ (10x plus cher !)
• Efficacité nettoyage : 90% des cas

**À tester d'abord (gratuit) :**
1. Roulage autoroutier 30 min à 3000 tr/min
2. Vérifier niveau AdBlue si SCR
3. Contrôler capteur pression différentielle

**Méfie-toi si :** Un garage refuse le nettoyage = fuis !

🛠️ **Solution maligne :** Nettoyage Re-Fap garanti, 24h.`;
    } else {
      baseResponse = `🧠 **Expertise FAP Militante** 🌪️

**Mon diagnostic honest :**
Symptômes typiques de FAP colmaté. BONNE NOUVELLE : ça se résout SANS remplacement dans 90% des cas !

**Solutions (du moins cher au plus cher) :**
1. **Test gratuit** : Roulage autoroutier 30 min
2. **Nettoyage FAP** (150-200€) ✅ **RECOMMANDÉ**
3. **Remplacement** (1800€) ❌ **Arnaque dans 90% des cas**

**Mon conseil militant :** Nettoyage chez partenaire Re-Fap = économie de 1600€ !`;
    }
  }
  else if (needType === "brakes") {
    if (userLevel === 0) {
      baseResponse = `🚗 **Diagnostic Freinage Militant** 🚗

Problème de freinage détecté !

**Questions importantes :**
• Le bruit apparaît au freinage ou en roulant ?
• Grincement, couinement ou bruit métallique ?

**Vérité sur les coûts :**
• Plaquettes : 80-150€ (pas 300€ !)
• Main d'œuvre : 1h max de boulot

**⚠️ Sécurité prioritaire** mais pas de panique !

**Méfie-toi si :** On te parle de "tout changer" sans diagnostic.`;
    } else {
      baseResponse = `🧠 **Expertise Freinage Militante** 🚗

**Diagnostic approfondi :**
• **Plaquettes usées** (80% des cas) - 120-180€
• **Disques voilés** (15% des cas) - 200-300€  

**Vrais coûts vs arnaque :**
✅ Plaquettes : 120€ tout compris
❌ "Pack sécurité" : 400€ (arnaque !)

**Mon conseil :** Demande toujours à voir les pièces usées !`;
    }
  }
  else if (needType === "engine") {
    if (userLevel === 0) {
      baseResponse = `⚠️ **Diagnostic Voyant Militant** ⚠️

Voyant moteur détecté !

**La vérité sur les voyants :**
• Orange fixe : Pollution - Pas d'urgence
• Orange clignotant : Allumage - Rouler doucement  
• Rouge : Urgence vraie - Arrêt immédiat

**À vérifier d'abord (gratuit) :**
• Niveau huile moteur
• Bouchon réservoir bien serré

**Méfie-toi si :** "Grosse réparation" sans diagnostic OBD !`;
    } else {
      baseResponse = `🧠 **Expertise Voyant Militante** ⚠️

**Diagnostic honest :**
• **Orange fixe :** FAP/EGR (60%) - 150-300€
• **Orange clignotant :** Allumage (25%) - 100-200€
• **Rouge :** Refroidissement (15%) - 200-600€

**Action :** Diagnostic OBD obligatoire (60-80€ max)

**Piège :** "Il faut démonter pour voir" = fuis !`;
    }
  }
  else if (lowerMessage.includes('arnaque') || lowerMessage.includes('cher')) {
    baseResponse = `🚨 **Mode Anti-Arnaque Activé !** 🚨

Tu sens l'arnaque ? Tu as raison d'être méfiant !

**Signaux d'alarme classiques :**
• Diagnostic >100€
• "Tout changer" sans explication
• Pression temporelle ("avant ce soir")
• Refus de montrer les pièces

**Ma technique anti-arnaque :**
"Devis détaillé SVP" + "Je réfléchis" = 90% des arnaques s'effondrent !

💪 **Je suis de ton côté contre les arnaqueurs !**`;
  }
  else {
    if (userLevel === 0) {
      baseResponse = `🤝 **Julien le Mécano Militant** 🛠️

Salut ! Je vais t'aider avec ton problème auto !

**Ma philosophie :**
• Du côté de ceux qui galèrent
• Solutions économiques prioritaires
• Anti-arnaque systématique

**Pour mieux t'aider :**
• Symptômes exacts ?
• Depuis quand ?
• Voyants allumés ?

💪 **Ma promesse :** Te faire économiser le maximum !`;
    } else {
      baseResponse = `🧠 **Diagnostic Militant Personnalisé** 🔧

**Analyse experte de ton problème :**
Je vais te donner les vraies solutions, pas les plus rentables pour les garages !

**Méthodologie militante :**
1. Diagnostic honest
2. Solutions du moins cher au plus cher
3. Astuces anti-arnaque

**Mon engagement :** T'aider vraiment !`;
    }
  }
  
  return baseResponse;
}

// === UTILITAIRES ===

function genererReponseEmailConfirme(email) {
  const prenom = email.split('@')[0].split('.')[0];
  return `🎉 **Super ${prenom} !** 📧

✅ **Email confirmé → Passage en mode accompagnement !**

📋 **Ce que tu vas recevoir :**
• Guide anti-arnaque complet
• Vrais coûts vs prix gonflés  
• Garages de confiance près de chez toi
• Astuces mécano pour éviter les récidives

📱 **Continue à me parler !**
*Je suis là pour t'aider, pas pour vendre.*

🛠️ **Raconte-moi ton problème en détail !**`;
}

function genererInvitationEmailBienveillante() {
  return `\n\n💡 **Pour aller plus loin gratuitement :**\nLaisse ton email si tu veux :\n• Le guide anti-arnaque complet\n• Les astuces pour économiser des centaines d'euros\n• Les garages de confiance près de chez toi\n\n📧 **Tape juste ton email** ⬇️ *(pas de spam !)*\n*Exemple : prenom.nom@gmail.com*`;
}

function detectNeedType(message) {
  const lower = message.toLowerCase();
  if (lower.includes('fap') || lower.includes('egr') || lower.includes('adblue') || 
      lower.includes('antipollution') || lower.includes('particul')) return "fap";
  if (lower.includes('frein') || lower.includes('brake') || lower.includes('plaquette')) return "brakes";
  if (lower.includes('moteur') || lower.includes('voyant')) return "engine";
  if (lower.includes('arnaque') || lower.includes('cher') || lower.includes('prix')) return "anti_arnaque";
  return "general";
}

function calculateMilitantScore(needType, mode) {
  const militantScores = { 
    fap: 9.0,
    brakes: 8.5,   
    engine: 8.0,
    anti_arnaque: 9.5,
    general: 7.5
  };
  
  const modeMultipliers = { 
    dual_brain_militant: 1.2, 
    claude_militant: 1.1, 
    openai_militant: 1.0, 
    simulation_militante: 0.95 
  };
  
  return Math.min(10, (militantScores[needType] || 7.5) * (modeMultipliers[mode] || 1.0));
}

function getPartnerMilitant(needType) {
  const partners = {
    fap: "Re-Fap",
    brakes: "Réseau confiance", 
    engine: "Expert diagnostic",
    anti_arnaque: "Garage certifié",
    general: "Réseau Re-Fap"
  };
  return partners[needType] || "Garage de confiance";
}
