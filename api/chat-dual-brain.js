// api/chat-dual-brain.js - Version Re-Fap Correcte Business Optimisée

// === SYSTÈME CTA INTELLIGENT RE-FAP ===
class SystemeCTAIntelligent {
  constructor() {
    this.parcoursUtilisateur = new Map();
    this.historiqueCTA = new Map();
  }

  // 🎯 ANALYSE ET ORIENTATION PRINCIPALE
  analyserEtOrienter(message, historique, userData = {}) {
    console.log('🎯 Analyse CTA Re-Fap pour:', message.substring(0, 50));
    
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
    
    const motsFAP = ['fap', 'filtre particule', 'antipollution', 'egr', 'adblue', 'p2002', 'p2463', 'fumee noire', 'perte puissance ville', 'voyant fap'];
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
    
    const indicateursCertains = ['code erreur', 'diagnostic fait', 'garage dit', 'confirme', 'sur que', 'certain', 'voyant fap', 'plus de puissance'];
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
    
    const indicateursBricoleur = ['demonte', 'bricoleur', 'repare moi', 'outillage', 'mecanique', 'fais moi meme', 'autonome', 'peux le demonter', 'demonter pour', 'faire nettoyer'];
    const indicateursParticulier = ['garage', 'mecanicien', 'reparateur', 'faire reparer', 'combien ca coute', 'devis', 'rdv'];
    
    const scoreBricoleur = indicateursBricoleur.filter(ind => contexte.includes(ind)).length;
    const scoreParticulier = indicateursParticulier.filter(ind => contexte.includes(ind)).length;
    
    if (scoreBricoleur > 0) return 'bricoleur_confirme';
    if (scoreParticulier > 0) return 'particulier_standard';
    return 'indetermine';
  }

  // 🎯 SÉLECTION SOUS-PARCOURS
  selectionnerSousParcours(parcours, certitude, profil) {
    if (parcours === 'fap_confirme') {
      if (profil === 'bricoleur_confirme') return 'fap_bricoleur_carter_cash';
      if (certitude === 'elevee') return 'fap_garage_partenaire_direct';
      if (certitude === 'faible') return 'fap_diagnostic_puis_refap';
      return 'fap_garage_partenaire_direct';
    }
    
    if (parcours === 'autre_probleme') {
      if (certitude === 'elevee') return 'autre_idgarages_direct';
      return 'autre_diagnostic_ligne_puis_rdv';
    }
    
    return 'diagnostic_qualification_complete';
  }

  // 💎 GÉNÉRATION CTA RE-FAP
  genererCTA(sousParcours, contexte) {
    const configs = {
      fap_garage_partenaire_direct: {
        type: 'conversion_refap_garage',
        message: `🔧 **SOLUTION RE-FAP - NETTOYAGE CABINE**

**💡 FAP bouché = Nettoyage en cabine Re-Fap**
• ✅ **Jusqu'à 80% d'économie** vs remplacement
• ✅ **Garantie 1 an** sur le nettoyage
• ✅ **Traitement sous 48h**
• ✅ **Solution écologique**

**🛠️ Process :** Garage partenaire → diagnostic → dépôt → nettoyage cabine → remontage

**STOP au remplacement systématique !**`,
        boutons: [
          { text: "🔍 Trouver garage partenaire", action: "garage_partenaire_refap", data: { type: "garage_partenaire", url: "https://re-fap.fr/trouver_garage_partenaire/" } },
          { text: "📞 Diagnostic idGarages", action: "diagnostic_idgarages", data: { type: "diagnostic", url: "https://www.idgarages.com/fr-fr/prestations/diagnostic-electronique?utm_source=re-fap&utm_medium=partenariat&utm_campaign=diagnostic-electronique&ept-publisher=re-fap&ept-name=re-fap-diagnostic-electronique" } }
        ]
      },

      fap_bricoleur_carter_cash: {
        type: 'conversion_bricoleur_actionnable',
        message: `🔧 **PARFAIT ! Solutions pour Bricoleur**

**💰 Option 1 - Carter-Cash Équipé :**
• **99-149€** selon ton modèle
• Centres avec machine Re-Fap
• Tu apportez, on nettoie, tu récupères

**📦 Option 2 - Envoi Postal :**
• Service clé en main complet
• Traitement 48h garanti`,
        boutons: [
          { text: "🏪 Centres Carter-Cash équipés", action: "carter_cash_equipes", data: { type: "carter_cash", url: "https://auto.re-fap.fr/carter-cash_machine_re-fap/" } },
          { text: "📦 Service postal Re-Fap", action: "nettoyage_postal", data: { type: "postal", url: "https://auto.re-fap.fr/" } }
        ]
      },

      fap_diagnostic_puis_refap: {
        type: 'diagnostic_refap',
        message: `🔍 **DIAGNOSTIC PUIS NETTOYAGE RE-FAP**

**🎯 Étapes recommandées :**
1. Diagnostic pour confirmer FAP bouché
2. Orientation vers nettoyage cabine Re-Fap
3. Économie jusqu'à 80% vs remplacement

**Garages partenaires formés Re-Fap**`,
        boutons: [
          { text: "📞 Diagnostic idGarages", action: "diagnostic_idgarages", data: { type: "diagnostic" } },
          { text: "🔍 Garage partenaire Re-Fap", action: "garage_partenaire_refap", data: { type: "garage_partenaire" } }
        ]
      },

      autre_idgarages_direct: {
        type: 'conversion_idgarages',
        message: `🔧 **DIAGNOSTIC PROFESSIONNEL idGarages**

**🎯 Réseau partenaire Re-Fap :**
• Diagnostic électronique complet
• Orientation vers solution économique
• Transparence des tarifs`,
        boutons: [
          { text: "📞 Diagnostic idGarages", action: "diagnostic_idgarages", data: { type: "diagnostic" } }
        ]
      },

      autre_diagnostic_ligne_puis_rdv: {
        type: 'diagnostic_orientation',
        message: `🔍 **DIAGNOSTIC EN LIGNE PUIS ORIENTATION**

**Processus :**
• Questions ciblées sur tes symptômes
• Orientation vers solution adaptée
• Garage partenaire si nécessaire`,
        boutons: [
          { text: "🔍 Diagnostic en ligne", action: "diagnostic_ligne_complet", data: { type: "diagnostic_ligne" } },
          { text: "📞 Diagnostic idGarages", action: "diagnostic_idgarages", data: { type: "diagnostic" } }
        ]
      },

      diagnostic_qualification_complete: {
        type: 'qualification_generale',
        message: `❓ **DIAGNOSTIC PERSONNALISÉ**

**Aide pour identifier ton problème :**
• Questions ciblées selon symptômes
• Solutions économiques prioritaires
• Orientation Re-Fap si FAP détecté`,
        boutons: [
          { text: "🔍 Diagnostic complet", action: "diagnostic_ligne_complet", data: { type: "diagnostic_ligne" } }
        ]
      }
    };

    const config = configs[sousParcours] || {
      type: 'orientation_generale',
      message: `🔧 **Assistance Technique Re-Fap**`,
      boutons: [
        { text: "🔍 Diagnostic", action: "diagnostic_general", data: { type: "diagnostic_general" } }
      ]
    };

    return config;
  }
}

// Instance globale
const ctaSystem = new SystemeCTAIntelligent();

// === API HANDLER PRINCIPAL ===
export default async function handler(req, res) {
  // 🚨 DEBUG - NOUVEAU CODE RE-FAP ACTIF
  console.log('🔥🔥🔥 NOUVEAU CODE RE-FAP DÉPLOYÉ - VERSION CORRIGÉE 🔥🔥🔥');
  
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

    console.log('🔧 API Re-Fap NOUVEAU:', { message: message?.substring(0, 50), action });

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
          mode: "🔧 Accompagnement Re-Fap",
          userLevel: 1,
          email: userEmail,
          refap: true,
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
    let mode = "simulation_refap";
    let economicValue = 150;
    
    try {
      const claudeResponse = await callClaudeRefap(message, userLevel);
      const openaiResponse = await callOpenAIRefap(message, userLevel);
      
      if (claudeResponse && openaiResponse) {
        response = await fusionRefap(message, claudeResponse, openaiResponse, userLevel);
        mode = "dual_brain_refap";
        economicValue = 200;
      } else if (claudeResponse) {
        response = formatClaudeRefap(claudeResponse, userLevel);
        mode = "claude_refap";
        economicValue = 180;
      } else {
        response = await simulationRefapIntelligente(message, userLevel);
        mode = "simulation_refap";
      }
    } catch (error) {
      response = await simulationRefapIntelligente(message, userLevel);
      mode = "simulation_refap";
    }

    // 🎯 GÉNÉRATION CTA INTELLIGENT
    const ctaAnalyse = ctaSystem.analyserEtOrienter(
      message, 
      historique, 
      { ...userData, sessionId, interactions: historique.length }
    );

    console.log('🎯 CTA Re-Fap généré:', ctaAnalyse.sousParcours);

    // Ajout invitation email SEULEMENT si niveau 0 ET pas d'email ET pas d'email dans l'historique
    const hasEmailInHistory = historique.some(msg => emailRegex.test(msg)) || userData.email;
    if (userLevel === 0 && !hasEmailInHistory) {
      response += genererInvitationEmailBienveillante();
    }

    const needType = detectNeedType(message);
    const baseScore = calculateRefapScore(needType, mode);
    const leadValue = Math.round(economicValue * 0.20); // 20% pour Re-Fap

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
        partner: "Re-Fap",
        refap: true,
        timestamp: new Date().toISOString(),
        cta_tracking: ctaAnalyse.tracking
      }
    });

  } catch (error) {
    console.error('💥 Erreur API Re-Fap:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur temporaire',
      fallback: "Salut ! Assistant Re-Fap. Petit souci technique, mais décris-moi ton problème FAP... 🔧"
    });
  }
}

// === GESTION ACTIONS CTA ===
async function handleCTAAction(action, requestBody, res) {
  const { userData = {}, sessionId, ctaData = {} } = requestBody;
  
  console.log('🎯 Action CTA Re-Fap:', action, ctaData);

  try {
    switch (action) {
      case 'garage_partenaire_refap':
        return await handleGaragePartenaireRefap(userData, res);
        
      case 'diagnostic_idgarages':
        return await handleDiagnosticIdgarages(userData, res);
        
      case 'carter_cash_equipes':
        return await handleCarterCashEquipes(userData, res);
        
      case 'nettoyage_postal':
        return await handleNettoyagePostal(userData, res);
        
      case 'diagnostic_ligne_complet':
        return await handleDiagnosticLigneComplet(userData, res);
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Action CTA non reconnue'
        });
    }
  } catch (error) {
    console.error('❌ Erreur action CTA Re-Fap:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur traitement CTA'
    });
  }
}

// === HANDLERS CTA RE-FAP ===

async function handleGaragePartenaireRefap(userData, res) {
  const message = `🔍 **TROUVER UN GARAGE PARTENAIRE RE-FAP**

**🎯 Avantages réseau partenaire :**
• ✅ Formés au process Re-Fap
• ✅ Diagnostic → dépôt → nettoyage cabine → remontage
• ✅ Tarifs transparents
• ✅ Garantie 1 an sur nettoyage

**🌐 Trouve le garage le plus proche :**
👉 **https://re-fap.fr/trouver_garage_partenaire/**

**💡 Réseau MIDAS et garages indépendants partenaires**
**🔧 Solution écologique et économique garantie**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'garage_partenaire_refap',
    redirect_url: 'https://re-fap.fr/trouver_garage_partenaire/',
    cta: {
      type: 'redirect_garage_partenaire',
      message: "🔍 **Prêt à trouver ton garage ?**",
      boutons: [
        { text: "🌐 Ouvrir la carte", action: "open_garage_map", data: { url: "https://re-fap.fr/trouver_garage_partenaire/" } }
      ]
    }
  });
}

async function handleDiagnosticIdgarages(userData, res) {
  const message = `📞 **DIAGNOSTIC ÉLECTRONIQUE idGarages**

**🎯 Partenaire officiel Re-Fap :**
• ✅ Diagnostic électronique complet
• ✅ Identification précise problème FAP
• ✅ Orientation vers nettoyage Re-Fap
• ✅ Réseau national 2000+ centres

**🌐 Prendre RDV diagnostic :**
👉 **https://www.idgarages.com/fr-fr/prestations/diagnostic-electronique?utm_source=re-fap&utm_medium=partenariat&utm_campaign=diagnostic-electronique&ept-publisher=re-fap&ept-name=re-fap-diagnostic-electronique**

**💡 Tarif diagnostic transparent**
**🔧 Orientation Re-Fap après confirmation**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'diagnostic_idgarages',
    redirect_url: 'https://www.idgarages.com/fr-fr/prestations/diagnostic-electronique?utm_source=re-fap&utm_medium=partenariat&utm_campaign=diagnostic-electronique&ept-publisher=re-fap&ept-name=re-fap-diagnostic-electronique',
    cta: {
      type: 'redirect_idgarages',
      message: "📞 **Prendre RDV diagnostic ?**",
      boutons: [
        { text: "🌐 RDV idGarages", action: "open_idgarages", data: { url: "diagnostic_idgarages" } }
      ]
    }
  });
}

async function handleCarterCashEquipes(userData, res) {
  const message = `🏪 **CARTER-CASH ÉQUIPÉS MACHINE RE-FAP**

**🔧 Pour les bricoleurs :**
• ✅ **Prix : 99-149€** selon modèle véhicule
• ✅ Tu démontez ton FAP toi-même
• ✅ Nettoyage cabine professionnel
• ✅ Centres équipés de la machine Re-Fap

**🌐 Centres Carter-Cash équipés :**
👉 **https://auto.re-fap.fr/carter-cash_machine_re-fap/**

**⚠️ Vérifier disponibilité machine avant déplacement**
**🔧 Process : démontage → apport → nettoyage → récupération**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'carter_cash_equipes',
    redirect_url: 'https://auto.re-fap.fr/carter-cash_machine_re-fap/',
    prix_range: '99-149€',
    cta: {
      type: 'redirect_carter_cash',
      message: "🏪 **Voir les centres équipés ?**",
      boutons: [
        { text: "🌐 Carter-Cash équipés", action: "open_carter_cash", data: { url: "carter_cash_equipes" } }
      ]
    }
  });
}

async function handleNettoyagePostal(userData, res) {
  const message = `📦 **NETTOYAGE FAP RE-FAP - ENVOI POSTAL**

**🎯 Service clé en main :**
• ✅ Démontage par garage partenaire
• ✅ Envoi postal sécurisé
• ✅ Nettoyage cabine Re-Fap
• ✅ Retour sous 48h

**🌐 Informations et tarifs :**
👉 **https://auto.re-fap.fr/**

**💡 Solution pour tous les garages**
**🔧 Process complet géré par Re-Fap**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'nettoyage_postal',
    redirect_url: 'https://auto.re-fap.fr/',
    cta: {
      type: 'redirect_postal',
      message: "📦 **En savoir plus ?**",
      boutons: [
        { text: "🌐 Service postal", action: "open_postal", data: { url: "nettoyage_postal" } }
      ]
    }
  });
}

async function handleDiagnosticLigneComplet(userData, res) {
  const message = `🔍 **DIAGNOSTIC EN LIGNE PERSONNALISÉ**

**🎯 Questions ciblées pour identifier :**
• Type de problème (FAP, moteur, autres)
• Urgence de l'intervention
• Orientation vers solution adaptée

**💡 Si FAP détecté → Orientation Re-Fap**
**🔧 Diagnostic gratuit et conseil expert**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'diagnostic_ligne_complet',
    cta: {
      type: 'diagnostic_interactif',
      form: {
        fields: ['vehicule', 'symptomes_principaux', 'voyants_allumes', 'perte_puissance'],
        required: ['vehicule', 'symptomes_principaux'],
        title: '🔍 Diagnostic Personnalisé'
      }
    }
  });
}

// === APPELS IA RE-FAP ===

async function callClaudeRefap(message, userLevel) {
  try {
    const claudeKey = process.env.CLAUDE_API_KEY;
    if (!claudeKey) return null;

    const refapPrompt = `Tu es un assistant IA spécialisé en mécanique auto, partenaire de Re-Fap.

MISSION : Proposer systématiquement le nettoyage FAP Re-Fap plutôt que le remplacement.

LOGIQUE RE-FAP :
- Si symptôme FAP confirmé → orienter vers Re-Fap ou garage partenaire
- Si bricoleur → Carter-Cash équipé (99-149€) ou envoi postal
- Sinon → garage partenaire (MIDAS, idGarages) pour diagnostic + nettoyage + remontage

ARGUMENTS CLÉS :
- Solution écologique et économique
- Garantie 1 an sur nettoyage
- Jusqu'à 80% d'économie vs remplacement
- Traitement sous 48h

NIVEAU ${userLevel} : ${userLevel === 0 ? "Aide gratuite" : "Accompagnement personnalisé"}

Reste technique, précis et orienté Re-Fap.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        messages: [
          { role: 'user', content: `${refapPrompt}\n\nProblème auto: ${message}` }
        ]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.content[0].text;

  } catch (error) {
    console.error('❌ Erreur Claude Re-Fap:', error.message);
    return null;
  }
}

async function callOpenAIRefap(message, userLevel) {
  try {
    const openaiKey = process.env.CLE_API_OPENAI;
    if (!openaiKey) return null;

    const refapPrompt = `Tu es un assistant spécialisé Re-Fap. 

MISSION : Orienter vers nettoyage FAP Re-Fap au lieu de remplacement.

PROCESS :
- Diagnostic FAP → nettoyage cabine Re-Fap
- Bricoleur → Carter-Cash équipé (99-149€)
- Particulier → garage partenaire

ARGUMENTS :
- Écologique, économique, garanti 1 an
- 80% d'économie, traitement 48h

NIVEAU ${userLevel} : ${userLevel === 0 ? "Aide gratuite" : "Accompagnement expert"}

Sois technique et orienté solution Re-Fap.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 800,
        messages: [
          { role: 'system', content: refapPrompt },
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('❌ Erreur OpenAI Re-Fap:', error.message);
    return null;
  }
}

// === FUSIONS ET FORMATAGE ===

async function fusionRefap(message, claudeResponse, openaiResponse, userLevel) {
  if (userLevel === 0) {
    return `🔧 **Diagnostic Re-Fap Dual Brain** 🔧

${claudeResponse}

💡 **Perspective complémentaire :**
${openaiResponse}`;
  } else {
    return `🧠 **Expertise Re-Fap Dual Brain** 🔧

**🎯 Analyse Technique :**
${claudeResponse}

**💡 Approche Solution :**
${openaiResponse}`;
  }
}

function formatClaudeRefap(claudeResponse, userLevel) {
  if (userLevel === 0) {
    return `🔧 **Diagnostic Re-Fap** 🔧\n\n${claudeResponse}`;
  } else {
    return `🧠 **Expertise Re-Fap** 🔧\n\n${claudeResponse}`;
  }
}

// === SIMULATION RE-FAP ===

async function simulationRefapIntelligente(message, userLevel) {
  const needType = detectNeedType(message);
  const lowerMessage = message.toLowerCase();
  
  let baseResponse = "";
  
  if (needType === "fap") {
    if (userLevel === 0) {
      baseResponse = `🔧 **Diagnostic Re-Fap - FAP Détecté**

Voyant FAP + perte puissance = FAP bouché confirmé !

**💡 Solution Re-Fap (STOP au remplacement) :**
• **Nettoyage cabine professionnel** comme neuf
• **Jusqu'à 80% d'économie** vs remplacement 
• **Garantie 1 an** - Traitement 48h

**🔧 Tes options :**
• **Bricoleur ?** Carter-Cash équipé (99-149€)
• **Garage ?** Partenaire Re-Fap service complet

Questions pour t'orienter précisément :
- Marque/modèle de ta voiture ?
- Tu peux démonter le FAP ou tu préfères confier au garage ?`;
    } else {
      // Email confirmé - Plus direct et actionnable
      baseResponse = `🔧 **Diagnostic Re-Fap Confirmé**

**FAP bouché détecté :** Voyant + perte puissance = signature classique.

**Process Re-Fap optimal :**
✅ **Nettoyage cabine** au lieu de remplacement
✅ **80% d'économie garantie** 
✅ **Traitement 48h + garantie 1 an**

**Tes options immédiates :**
• **Carter-Cash équipé :** 99-149€ (démontage autonome)
• **Garage partenaire :** Service complet diagnostic → nettoyage → remontage

Tu peux démonter ton FAP ou tu préfères le service garage complet ?`;
    }
  }
  else if (needType === "brakes") {
    baseResponse = `🔧 **Diagnostic Freinage**

Problème freinage = diagnostic professionnel obligatoire (sécurité).

**Orientation :** Garage partenaire idGarages pour diagnostic transparent.

Décris tes symptômes exacts ?`;
  }
  else if (needType === "engine") {
    baseResponse = `🔧 **Diagnostic Voyant Moteur**

Voyant moteur = diagnostic OBD nécessaire.

**Si FAP/EGR :** Orientation Re-Fap
**Si autre :** Garage idGarages

Diagnostic en ligne pour t'orienter ?`;
  }
  else {
    baseResponse = `🔧 **Assistant Re-Fap**

Spécialisé FAP et solutions économiques vs remplacement.

**Expertise :** Nettoyage Re-Fap, réseau garages partenaires.

Décris tes symptômes pour diagnostic personnalisé ?`;
  }
  
  return baseResponse;
}

// === UTILITAIRES ===

function genererReponseEmailConfirme(email) {
  const prenom = email.split('@')[0].split('.')[0];
  return `🎉 **Merci ${prenom} !** 📧

✅ **Email confirmé → Accompagnement Re-Fap personnalisé**

📋 **Tu vas recevoir :**
• Guide nettoyage FAP vs remplacement
• Réseau garages partenaires Re-Fap
• Conseils techniques anti-arnaque

🔧 **Continue à me parler pour ton diagnostic !**`;
}

function genererCTAEmailConfirme() {
  return {
    type: 'email_confirmed',
    message: "🎉 **Email confirmé ! Tu peux maintenant :**",
    boutons: [
      { text: "🔧 Continuer diagnostic", action: "continuer_diagnostic", data: { email_confirmed: true } }
    ]
  };
}

function genererInvitationEmailBienveillante() {
  return `\n\n💡 **Pour aller plus loin :**\nLaisse ton email pour :\n• Guide Re-Fap complet\n• Réseau garages partenaires\n• Conseils techniques personnalisés\n\n📧 **Email** ⬇️ *(pas de spam)*\n*Exemple : prenom.nom@gmail.com*`;
}

function detectNeedType(message) {
  const lower = message.toLowerCase();
  if (lower.includes('fap') || lower.includes('egr') || lower.includes('adblue') || 
      lower.includes('antipollution') || lower.includes('particul') || lower.includes('voyant fap')) return "fap";
  if (lower.includes('frein') || lower.includes('brake') || lower.includes('plaquette')) return "brakes";
  if (lower.includes('moteur') || lower.includes('voyant')) return "engine";
  return "general";
}

function calculateRefapScore(needType, mode) {
  const refapScores = { fap: 9.5, brakes: 7.0, engine: 8.0, general: 7.5 };
  const modeMultipliers = { dual_brain_refap: 1.2, claude_refap: 1.1, openai_refap: 1.0, simulation_refap: 0.95 };
  return Math.min(10, (refapScores[needType] || 7.5) * (modeMultipliers[mode] || 1.0));
}

function getLevelName(userLevel) {
  const names = { 0: "Aide Gratuite", 1: "Accompagnement Re-Fap", 2: "Support Expert" };
  return names[userLevel] || "Assistant";
}
