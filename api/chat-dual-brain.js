// api/chat-dual-brain.js - Version Militante + CTA Intelligent Complet

// === SYSTÈME CTA INTELLIGENT INTÉGRÉ ===
class SystemeCTAIntelligent {
  constructor() {
    this.parcoursUtilisateur = new Map();
    this.historiqueCTA = new Map();
  }

  // 🎯 ANALYSE ET ORIENTATION PRINCIPALE
  analyserEtOrienter(message, historique, userData = {}) {
    console.log('🎯 Analyse CTA pour:', message.substring(0, 50));
    
    const parcoursDetecte = this.detecterParcoursPrincipal(message, historique);
    const niveauCertitude = this.analyserCertitude(message, historique);
    const profilUtilisateur = this.detecterProfilUtilisateur(message, historique, userData);
    const sousParcours = this.selectionnerSousParcours(parcoursDetecte, niveauCertitude, profilUtilisateur);
    const ctaPersonnalise = this.genererCTA(sousParcours, {
      parcours: parcoursDetecte,
      certitude: niveauCertitude,
      profil: profilUtilisateur,
      userData,
      historique
    });

    return {
      parcours: parcoursDetecte,
      sousParcours: sousParcours,
      certitude: niveauCertitude,
      profil: profilUtilisateur,
      cta: ctaPersonnalise,
      tracking: {
        sessionId: userData.sessionId,
        timestamp: new Date().toISOString(),
        conversion_path: `${parcoursDetecte}_${sousParcours}`
      }
    };
  }

  // 🔍 DÉTECTION PARCOURS PRINCIPAL
  detecterParcoursPrincipal(message, historique) {
    const messageLower = message.toLowerCase();
    const contexteComplet = (historique.join(' ') + ' ' + message).toLowerCase();
    
    const motsFAP = ['fap', 'filtre particule', 'antipollution', 'egr', 'adblue', 'p2002', 'p2463', 'fumee noire', 'perte puissance ville'];
    const scoreFAP = motsFAP.filter(mot => contexteComplet.includes(mot)).length;
    
    const motsAutres = ['frein', 'embrayage', 'courroie', 'alternateur', 'demarrage', 'direction', 'suspension'];
    const scoreAutres = motsAutres.filter(mot => contexteComplet.includes(mot)).length;
    
    const motsIncertains = ['voyant', 'bruit', 'vibration', 'pas sur', 'sais pas', 'probleme', 'panne'];
    const scoreIncertain = motsIncertains.filter(mot => contexteComplet.includes(mot)).length;
    
    if (scoreFAP > 0) return 'fap_confirme';
    if (scoreAutres > scoreIncertain) return 'autre_probleme';
    return 'diagnostic_necessaire';
  }

  // 📊 ANALYSE NIVEAU DE CERTITUDE
  analyserCertitude(message, historique) {
    const contexte = (message + ' ' + historique.join(' ')).toLowerCase();
    
    const indicateursCertains = ['code erreur', 'diagnostic fait', 'garage dit', 'confirme', 'sur que', 'certain'];
    const indicateursIncertains = ['peut etre', 'sais pas', 'pas sur', 'bizarre', 'etrange', 'jamais vu'];
    
    const certains = indicateursCertains.filter(ind => contexte.includes(ind)).length;
    const incertains = indicateursIncertains.filter(ind => contexte.includes(ind)).length;
    
    if (certains > incertains) return 'elevee';
    if (incertains > 2) return 'faible';
    return 'moyenne';
  }

  // 👤 DÉTECTION PROFIL UTILISATEUR
  detecterProfilUtilisateur(message, historique, userData) {
    const contexte = (message + ' ' + historique.join(' ')).toLowerCase();
    
    const indicateursBricoleur = ['demonte', 'bricoleur', 'repare moi', 'outillage', 'mecanique', 'fais moi meme', 'autonome'];
    const indicateursParticulier = ['garage', 'mecanicien', 'reparateur', 'faire reparer', 'combien ca coute', 'devis', 'rdv'];
    
    const scoreBricoleur = indicateursBricoleur.filter(ind => contexte.includes(ind)).length;
    const scoreParticulier = indicateursParticulier.filter(ind => contexte.includes(ind)).length;
    
    if (userData.interactions > 3 && scoreBricoleur > 0) return 'bricoleur_confirme';
    if (scoreBricoleur > scoreParticulier) return 'bricoleur_potentiel';
    if (scoreParticulier > 0) return 'particulier_standard';
    return 'indetermine';
  }

  // 🎯 SÉLECTION SOUS-PARCOURS
  selectionnerSousParcours(parcours, certitude, profil) {
    if (parcours === 'fap_confirme') {
      if (certitude === 'elevee') {
        if (profil === 'bricoleur_confirme') return 'fap_bricoleur_direct';
        if (profil === 'particulier_standard') return 'fap_garage_direct';
        return 'fap_qualification_profil';
      }
      if (certitude === 'faible') return 'fap_diagnostic_requis_suivi';
      return 'fap_diagnostic_general';
    }
    
    if (parcours === 'autre_probleme') {
      if (certitude === 'elevee') return 'autre_rdv_partenaire_direct';
      return 'autre_diagnostic_ligne_puis_rdv';
    }
    
    return 'diagnostic_qualification_complete';
  }

  // 💎 GÉNÉRATION CTA PERSONNALISÉ
  genererCTA(sousParcours, contexte) {
    const configs = {
      fap_bricoleur_direct: {
        type: 'conversion_immediate',
        message: `🔧 **Tu veux démonter ton FAP toi-même ?** Parfait !

**Tes options pour le nettoyage :**
• **Carter Cash équipé** (2 machines en France)
• **Re-Fap Clermont** (tu l'apportes) 
• **Envoi postal** (on s'occupe de tout)`,
        boutons: [
          { text: "🏪 Carter Cash près de moi", action: "localiser_carter_cash", data: { type: "carter_cash" } },
          { text: "🚗 Apporter à Clermont", action: "infos_clermont", data: { type: "clermont" } },
          { text: "📦 Envoi postal Re-Fap", action: "formulaire_envoi", data: { type: "envoi_postal" } }
        ]
      },

      fap_garage_direct: {
        type: 'conversion_immediate',
        message: `🚗 **Ton FAP a besoin d'attention !**

**Solutions Re-Fap près de chez toi :**
• **Nettoyage FAP** (200€) vs remplacement (2000€)
• **Garages partenaires** formés Re-Fap`,
        boutons: [
          { text: "🛠️ Garage Re-Fap près de moi", action: "localiser_garage_refap", data: { type: "garage_refap" } },
          { text: "📞 Rappel expert (gratuit)", action: "demande_rappel_fap", data: { type: "rappel_fap" } }
        ]
      },

      fap_diagnostic_requis_suivi: {
        type: 'nurturing_conversion',
        message: `🔍 **Pour confirmer que c'est bien le FAP, diagnostic garage recommandé.**

**Plan d'action intelligent :**
1️⃣ Diagnostic chez un partenaire (60-80€)
2️⃣ Reste en contact avec nous pendant le diagnostic  
3️⃣ On t'oriente selon le résultat`,
        boutons: [
          { text: "🔍 Garage diagnostic près de moi", action: "localiser_garage_diagnostic", data: { type: "diagnostic" } },
          { text: "📧 Rester en contact (guide)", action: "email_suivi_diagnostic", data: { type: "nurturing_fap" } }
        ]
      },

      autre_rdv_partenaire_direct: {
        type: 'conversion_partenaire',
        message: `🔧 **Problème identifié !**

**Solution :** Diagnostic chez un partenaire de confiance
• **idGarages** : Réseau certifié anti-arnaque
• **Devis transparent** avant intervention`,
        boutons: [
          { text: "📅 RDV idGarages près de moi", action: "rdv_idgarages", data: { type: "rdv_idgarages" } },
          { text: "📧 Guide diagnostic (gratuit)", action: "guide_diagnostic_autre", data: { type: "guide_autre" } }
        ]
      },

      diagnostic_qualification_complete: {
        type: 'qualification_conversion',
        message: `❓ **On va identifier ton problème ensemble !**

**Diagnostic en ligne Re-Fap :**
• Questions ciblées pour cerner le souci
• Solutions économiques selon diagnostic`,
        boutons: [
          { text: "🔍 Diagnostic en ligne (5 min)", action: "diagnostic_ligne_complet", data: { type: "diagnostic_ligne" } },
          { text: "💬 Chat avec expert", action: "chat_expert_diagnostic", data: { type: "chat_expert" } }
        ]
      }
    };

    const config = configs[sousParcours] || {
      type: 'orientation_generale',
      message: `🤝 **Je suis là pour t'aider !**`,
      boutons: [
        { text: "🔍 Diagnostic gratuit", action: "diagnostic_general", data: { type: "diagnostic_general" } }
      ]
    };

    return config;
  }
}

// Instance globale
const ctaSystem = new SystemeCTAIntelligent();

// === API HANDLER PRINCIPAL ===
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  try {
    const { message, userData = {}, sessionId, historique = [], action } = req.body;

    console.log('🤝 API Militante + CTA:', { message: message?.substring(0, 50), action });

    // GESTION DES ACTIONS CTA
    if (action) {
      return await handleCTAAction(action, req.body, res);
    }

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message requis' });
    }

    // Détection email automatique
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const userEmail = message.match(emailRegex)?.[0];
    
    if (userEmail) {
      return res.status(200).json({
        success: true,
        message: genererReponseEmailConfirme(userEmail),
        cta: genererCTAEmailConfirme(),
        metadata: {
          mode: "🤝 Accompagnement Personnalisé",
          userLevel: 1,
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

    // Appel IA pour réponse
    let response = "";
    let mode = "simulation_militante";
    let economicValue = 200;
    
    try {
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
      } else {
        response = await simulationMilitanteIntelligente(message, userLevel);
        mode = "simulation_militante";
      }
    } catch (error) {
      response = await simulationMilitanteIntelligente(message, userLevel);
      mode = "simulation_militante";
    }

    // 🎯 GÉNÉRATION CTA INTELLIGENT
    const ctaAnalyse = ctaSystem.analyserEtOrienter(
      message, 
      historique, 
      { ...userData, sessionId, interactions: historique.length }
    );

    console.log('🎯 CTA généré:', ctaAnalyse.sousParcours);

    // Ajout invitation email si pas de CTA spécifique et niveau 0
    if (userLevel === 0 && !ctaAnalyse.cta.boutons?.some(btn => btn.data.type.includes('email'))) {
      response += genererInvitationEmailBienveillante();
    }

    const needType = detectNeedType(message);
    const baseScore = calculateMilitantScore(needType, mode);
    const leadValue = Math.round(economicValue * 0.15);

    return res.status(200).json({
      success: true,
      message: response,
      cta: ctaAnalyse.cta,
      parcours: {
        type: ctaAnalyse.parcours,
        sous_parcours: ctaAnalyse.sousParcours,
        certitude: ctaAnalyse.certitude,
        profil: ctaAnalyse.profil
      },
      metadata: {
        mode,
        userLevel,
        levelName: getLevelName(userLevel),
        needType,
        leadValue,
        economicValue,
        score: baseScore,
        partner: getPartnerMilitant(needType),
        militant: true,
        timestamp: new Date().toISOString(),
        cta_tracking: ctaAnalyse.tracking
      }
    });

  } catch (error) {
    console.error('💥 Erreur API militante + CTA:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur temporaire',
      fallback: "Salut ! C'est Julien ! Petit souci technique, mais décris-moi ton problème auto... 💪"
    });
  }
}

// === GESTION ACTIONS CTA ===
async function handleCTAAction(action, requestBody, res) {
  const { userData = {}, sessionId, ctaData = {} } = requestBody;
  
  console.log('🎯 Action CTA:', action, ctaData);

  try {
    switch (action) {
      case 'localiser_carter_cash':
        return await handleLocalisationCarterCash(userData, res);
        
      case 'localiser_garage_refap':
        return await handleLocalisationGarageRefap(userData, res);
        
      case 'rdv_idgarages':
        return await handleRDVIdgarages(userData, res);
        
      case 'formulaire_envoi':
        return await handleFormulaireEnvoi(userData, res);
        
      case 'demande_rappel_fap':
        return await handleDemandeRappelFAP(userData, res);
        
      case 'email_suivi_diagnostic':
        return await handleEmailSuiviDiagnostic(userData, res);
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Action CTA non reconnue'
        });
    }
  } catch (error) {
    console.error('❌ Erreur action CTA:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur traitement CTA'
    });
  }
}

// === HANDLERS CTA ===

async function handleLocalisationCarterCash(userData, res) {
  const carterCashEquipes = [
    {
      nom: "Carter Cash Rungis",
      adresse: "Marché de Rungis, 94150 Rungis",
      telephone: "01 XX XX XX XX",
      horaires: "Lun-Ven 8h-17h"
    },
    {
      nom: "Carter Cash Lyon", 
      adresse: "Zone industrielle, 69000 Lyon",
      telephone: "04 XX XX XX XX",
      horaires: "Lun-Ven 8h-17h"
    }
  ];

  const message = `🏪 **Carter Cash équipés machine FAP** (2 en France)

${carterCashEquipes.map(cc => `📍 **${cc.nom}**
${cc.adresse}
📞 ${cc.telephone}
🕐 ${cc.horaires}`).join('\n\n')}

💡 **Étapes suivantes :**
1. Démonte ton FAP ✅
2. Appelle pour vérifier dispo machine
3. Prix nettoyage : ~200€`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'localisation_carter_cash',
    cta: {
      type: 'follow_up',
      message: "🔧 **Besoin d'aide pour continuer ?**",
      boutons: [
        { text: "📧 Guide démontage FAP", action: "guide_demontage_fap", data: { type: "guide_technique" } },
        { text: "📞 Aide pour démonter", action: "aide_demontage", data: { type: "support_technique" } }
      ]
    }
  });
}

async function handleLocalisationGarageRefap(userData, res) {
  const message = `🛠️ **Garages partenaires Re-Fap près de chez toi**

📍 **Recherche en cours selon ta position...**

💪 **Avantages réseau Re-Fap :**
• Nettoyage FAP garanti 2 ans
• Prix transparent : 200€ max
• Pas d'arnaque remplacement 
• Formation technique Re-Fap

📞 **Pour finaliser :** Laisse-moi tes coordonnées !`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'localisation_garage_refap',
    cta: {
      type: 'lead_capture',
      message: "📋 **Coordonnées pour localisation précise**",
      boutons: [
        { text: "📞 Me faire rappeler", action: "demande_rappel_localisation", data: { type: "rappel_localisation" } }
      ],
      form: {
        fields: ['nom', 'telephone', 'ville'],
        required: ['nom', 'telephone', 'ville']
      }
    }
  });
}

async function handleRDVIdgarages(userData, res) {
  const message = `📅 **Prise de RDV idGarages**

🎯 **idGarages - Réseau certifié anti-arnaque**
• Diagnostic transparent avant intervention
• Devis détaillé obligatoire
• Réseau de 2000+ garages

📞 **Un conseiller va t'appeler sous 2h** pour :
• Trouver le garage le plus proche
• Fixer un RDV selon tes dispos`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'rdv_idgarages',
    cta: {
      type: 'lead_generation',
      partner: 'idGarages',
      form: {
        fields: ['nom', 'telephone', 'email', 'ville', 'probleme', 'vehicule'],
        required: ['nom', 'telephone', 'ville', 'probleme']
      }
    }
  });
}

async function handleFormulaireEnvoi(userData, res) {
  const message = `📦 **Envoi postal Re-Fap Clermont**

🎯 **Service clé en main :**
1. Tu démontez ton FAP
2. Emballage sécurisé (on t'explique)  
3. Envoi par transporteur
4. Nettoyage professionnel Re-Fap
5. Retour sous 48h

💰 **Prix tout compris :** 250€ (nettoyage + transport)`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'formulaire_envoi',
    cta: {
      type: 'lead_generation_envoi',
      form: {
        fields: ['nom', 'telephone', 'email', 'adresse_complete', 'vehicule'],
        required: ['nom', 'telephone', 'adresse_complete', 'vehicule']
      }
    }
  });
}

async function handleDemandeRappelFAP(userData, res) {
  const message = `📞 **Rappel Expert FAP Re-Fap**

🧠 **Un expert FAP va t'appeler :**
• Diagnostic approfondi de ton cas
• Solutions personnalisées  
• Orientation vers la meilleure option

⏰ **Quand ?** 
• Urgent : dans les 2h
• Standard : dans la journée

💪 **100% gratuit, 0% vente forcée !**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'demande_rappel_fap',
    cta: {
      type: 'callback_request',
      form: {
        fields: ['nom', 'telephone', 'email', 'vehicule', 'probleme_detaille'],
        required: ['nom', 'telephone', 'probleme_detaille']
      }
    }
  });
}

async function handleEmailSuiviDiagnostic(userData, res) {
  const message = `📧 **Guide de suivi diagnostic FAP**

📚 **Tu vas recevoir par email :**
• Questions précises à poser au garage
• Comment interpréter le diagnostic  
• Que faire selon les résultats
• Contacts Re-Fap selon diagnostic

💡 **Stratégie militante :**
"Je veux juste le diagnostic, pas la réparation"

🤝 **On reste en contact pendant ton diagnostic !**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'email_suivi_diagnostic',
    cta: {
      type: 'email_nurturing',
      form: {
        fields: ['email', 'prenom', 'vehicule'],
        required: ['email']
      }
    }
  });
}

// === APPELS IA ===

async function callClaudeMilitant(message, userLevel) {
  try {
    const claudeKey = process.env.CLAUDE_API_KEY;
    if (!claudeKey) return null;

    const militantPrompt = `Tu es Julien, mécano digital MILITANT depuis 20 ans chez Re-Fap.

🎯 MISSION : Aider les automobilistes contre les arnaques !

TON MILITANT :
- "Je suis là pour t'aider, pas pour vendre"
- Solutions économiques prioritaires
- Anti-arnaque systématique
- Ton chaleureux et bienveillant

NIVEAU ${userLevel} : ${userLevel === 0 ? "Aide gratuite" : "Accompagnement approfondi"}

Réponds comme un vrai mécano militant qui veut vraiment aider.`;

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

    if (!response.ok) return null;
    const data = await response.json();
    return data.content[0].text;

  } catch (error) {
    console.error('❌ Erreur Claude:', error.message);
    return null;
  }
}

async function callOpenAIMilitant(message, userLevel) {
  try {
    const openaiKey = process.env.CLE_API_OPENAI;
    if (!openaiKey) return null;

    const militantPrompt = `Tu es un assistant mécano militant et engagé. Tu défends les automobilistes contre les arnaques.

PHILOSOPHIE : 
- Anti-arnaque systématique
- Solutions économiques prioritaires  
- Éducation des automobilistes
- Ton chaleureux et bienveillant

NIVEAU ${userLevel} : ${userLevel === 0 ? "Aide gratuite" : "Accompagnement approfondi"}

Réponds avec empathie et expertise, toujours du côté de l'automobiliste.`;

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

    if (!response.ok) return null;
    const data = await response.json();
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

// === SIMULATION MILITANTE ===

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

function genererCTAEmailConfirme() {
  return {
    type: 'email_confirmed',
    message: "🎉 **Email confirmé ! Tu peux maintenant :**",
    boutons: [
      { text: "🔧 Continuer le diagnostic", action: "continuer_diagnostic", data: { email_confirmed: true } }
    ]
  };
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
  const militantScores = { fap: 9.0, brakes: 8.5, engine: 8.0, anti_arnaque: 9.5, general: 7.5 };
  const modeMultipliers = { dual_brain_militant: 1.2, claude_militant: 1.1, openai_militant: 1.0, simulation_militante: 0.95 };
  return Math.min(10, (militantScores[needType] || 7.5) * (modeMultipliers[mode] || 1.0));
}

function getPartnerMilitant(needType) {
  const partners = { fap: "Re-Fap", brakes: "Réseau confiance", engine: "Expert diagnostic", anti_arnaque: "Garage certifié", general: "Réseau Re-Fap" };
  return partners[needType] || "Garage de confiance";
}

function getLevelName(userLevel) {
  const names = { 0: "Aide Gratuite", 1: "Accompagnement Personnalisé", 2: "Support Expert" };
  return names[userLevel] || "Helper";
}
