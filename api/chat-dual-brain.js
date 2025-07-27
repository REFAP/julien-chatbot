// api/chat-dual-brain.js - Version Militante + CTA Re-Fap Business Agressif

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
        if (profil === 'particulier_standard') return 'fap_solution_refap';
        return 'fap_solution_refap';
      }
      if (certitude === 'faible') return 'fap_diagnostic_refap';
      return 'fap_solution_refap';
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
      fap_solution_refap: {
        type: 'conversion_aggressive',
        message: `💥 **SOLUTION RE-FAP CLERMONT** 💥

**🔧 FAP bouché = 280€ chez Re-Fap** (au lieu de 1500-2000€ ailleurs)
• ✅ **Économie : 1720€** 💰
• ✅ Nettoyage professionnel garanti 2 ans
• ✅ Diagnostic gratuit inclus  
• ✅ 24h chrono

**⚠️ STOP À L'ARNAQUE !** Ne te fais pas avoir par "il faut le changer" = 2000€ !`,
        boutons: [
          { text: "💸 ÉCONOMISER 1720€", action: "rdv_refap_direct", data: { type: "refap_direct", prix: 280, economie: 1720 } },
          { text: "📞 Devis gratuit Re-Fap", action: "devis_refap", data: { type: "devis_refap" } },
          { text: "🚗 Service récupération", action: "recuperation_fap", data: { type: "recuperation" } }
        ]
      },

      fap_bricoleur_direct: {
        type: 'conversion_immediate',
        message: `🔧 **Tu veux démonter ton FAP toi-même ?** Parfait !

**💰 Solutions économiques :**
• **Re-Fap Clermont** (tu l'apportes) : 200€
• **Envoi postal** (on s'occupe de tout) : 250€
• **Carter Cash équipé** (2 machines en France) : ~200€

**📦 Service postal Re-Fap :** Le plus pratique !`,
        boutons: [
          { text: "📦 Envoi postal Re-Fap", action: "formulaire_envoi", data: { type: "envoi_postal" } },
          { text: "🚗 Apporter à Clermont", action: "infos_clermont", data: { type: "clermont" } },
          { text: "🏪 Carter Cash près de moi", action: "localiser_carter_cash", data: { type: "carter_cash" } }
        ]
      },

      fap_diagnostic_refap: {
        type: 'nurturing_conversion',
        message: `🔍 **Diagnostic FAP Gratuit Re-Fap**

**🎯 Avant de dépenser 2000€ ailleurs :**
• Diagnostic complet gratuit chez Re-Fap
• On confirme si c'est vraiment le FAP
• Solution 280€ vs 2000€ si réparable

**💡 Dans 90% des cas :** Simple nettoyage suffit !`,
        boutons: [
          { text: "🔍 Diagnostic gratuit Re-Fap", action: "diagnostic_gratuit_refap", data: { type: "diagnostic_gratuit" } },
          { text: "📞 Conseil expert (gratuit)", action: "conseil_expert_refap", data: { type: "conseil_expert" } }
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

      autre_diagnostic_ligne_puis_rdv: {
        type: 'diagnostic_puis_conversion',
        message: `🔍 **Diagnostic en ligne puis orientation**

**Étapes :**
1. Questions ciblées pour identifier le problème
2. Orientation vers la solution la plus économique
3. RDV chez un partenaire si nécessaire`,
        boutons: [
          { text: "🔍 Diagnostic en ligne (5 min)", action: "diagnostic_ligne_complet", data: { type: "diagnostic_ligne" } },
          { text: "💬 Chat avec expert", action: "chat_expert_diagnostic", data: { type: "chat_expert" } }
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
      case 'rdv_refap_direct':
        return await handleRDVRefapDirect(userData, res);
        
      case 'devis_refap':
        return await handleDevisRefap(userData, res);
        
      case 'recuperation_fap':
        return await handleRecuperationFap(userData, res);
        
      case 'diagnostic_gratuit_refap':
        return await handleDiagnosticGratuitRefap(userData, res);
        
      case 'conseil_expert_refap':
        return await handleConseilExpertRefap(userData, res);
        
      case 'formulaire_envoi':
        return await handleFormulaireEnvoi(userData, res);
        
      case 'infos_clermont':
        return await handleInfosClermont(userData, res);
        
      case 'localiser_carter_cash':
        return await handleLocalisationCarterCash(userData, res);
        
      case 'rdv_idgarages':
        return await handleRDVIdgarages(userData, res);
        
      case 'diagnostic_ligne_complet':
        return await handleDiagnosticLigneComplet(userData, res);
        
      case 'chat_expert_diagnostic':
        return await handleChatExpertDiagnostic(userData, res);
        
      case 'guide_diagnostic_autre':
        return await handleGuideDiagnosticAutre(userData, res);
        
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

// === HANDLERS CTA RE-FAP ===

async function handleRDVRefapDirect(userData, res) {
  const message = `🏃‍♂️ **RDV RE-FAP CLERMONT DIRECT**

**📍 Re-Fap Clermont-Ferrand**
📞 **04 73 XX XX XX**
📧 **contact@re-fap.fr**
🌐 **www.re-fap.fr**

**🎯 Ton RDV comprend :**
• ✅ Diagnostic FAP complet (gratuit)
• ✅ Devis transparent 280€ max
• ✅ Nettoyage professionnel si besoin
• ✅ Garantie 2 ans

**⏰ Disponibilités :**
• **Urgent :** Demain matin
• **Standard :** Cette semaine

**💰 Tu économises 1720€ vs remplacement !**

**📋 Un expert va t'appeler sous 2h pour finaliser.**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'rdv_refap_direct',
    business_impact: {
      partner: 'Re-Fap Clermont',
      service: 'Nettoyage FAP',
      prix: 280,
      economie: 1720,
      urgence: 'sous_2h'
    },
    cta: {
      type: 'lead_generation_refap',
      form: {
        fields: ['nom', 'telephone', 'email', 'vehicule', 'probleme_fap', 'urgence'],
        required: ['nom', 'telephone', 'vehicule'],
        title: '💸 ÉCONOMISER 1720€ - RDV Re-Fap'
      }
    }
  });
}

async function handleDevisRefap(userData, res) {
  const message = `📞 **DEVIS GRATUIT RE-FAP**

**🔍 Diagnostic téléphonique gratuit :**
• ✅ Questions précises sur ton FAP
• ✅ Estimation de faisabilité  
• ✅ Prix ferme garanti
• ✅ Conseil objectif (pas de vente forcée)

**⏱️ Durée :** 5 minutes max

**💡 Si c'est réparable :** 280€ tout compris
**💡 Si c'est mort :** On te dit la vérité !

**🎯 Un expert Re-Fap va t'appeler sous 2h.**
**💰 Économie potentielle : 1720€**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'devis_refap',
    cta: {
      type: 'callback_devis_refap',
      form: {
        fields: ['nom', 'telephone', 'vehicule', 'symptomes_fap', 'kilometrage'],
        required: ['nom', 'telephone', 'symptomes_fap'],
        title: '📞 Devis Gratuit Re-Fap'
      }
    }
  });
}

async function handleRecuperationFap(userData, res) {
  const message = `🚗 **SERVICE RÉCUPÉRATION FAP RE-FAP**

**🛠️ Service clé en main Re-Fap :**
• ✅ On vient chercher ta voiture
• ✅ Démontage FAP par nos soins
• ✅ Nettoyage professionnel Re-Fap
• ✅ Remontage et livraison
• ✅ Test final inclus

**💰 Prix tout compris : 380€**
*(280€ nettoyage + 100€ service complet)*

**📍 Zone d'intervention :** 100km autour de Clermont
**⏰ Délai :** 48h maximum
**💸 Économie vs remplacement : 1620€**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'recuperation_fap',
    cta: {
      type: 'service_recuperation',
      prix: 380,
      economie: 1620,
      form: {
        fields: ['nom', 'telephone', 'adresse_complete', 'vehicule', 'planning_souhaite'],
        required: ['nom', 'telephone', 'adresse_complete', 'vehicule'],
        title: '🚗 Service Récupération Re-Fap'
      }
    }
  });
}

async function handleDiagnosticGratuitRefap(userData, res) {
  const message = `🔍 **DIAGNOSTIC GRATUIT RE-FAP**

**🎯 Diagnostic complet offert :**
• ✅ Test complet FAP/EGR/AdBlue
• ✅ Lecture codes erreurs  
• ✅ Analyse état réel du filtre
• ✅ Conseil technique honest

**📍 Re-Fap Clermont**
**⏰ RDV sous 48h**
**💰 Diagnostic : 0€** (gratuit)

**💡 Si réparable :** 280€ au lieu de 2000€
**💡 Si irréparable :** On te dit la vérité

**🚗 Viens avec ta voiture, repars avec la solution !**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'diagnostic_gratuit_refap',
    cta: {
      type: 'rdv_diagnostic_gratuit',
      form: {
        fields: ['nom', 'telephone', 'vehicule', 'symptomes', 'disponibilites'],
        required: ['nom', 'telephone', 'vehicule'],
        title: '🔍 Diagnostic Gratuit Re-Fap'
      }
    }
  });
}

async function handleConseilExpertRefap(userData, res) {
  const message = `📞 **CONSEIL EXPERT RE-FAP GRATUIT**

**🧠 Un expert Re-Fap va t'appeler pour :**
• ✅ Analyser tes symptômes précis
• ✅ Te dire si c'est vraiment le FAP  
• ✅ T'expliquer les vraies solutions
• ✅ Te protéger des arnaques

**⏰ Appel sous 1h** (si urgent)
**🆓 100% gratuit** - 0% vente forcée
**💪 20 ans d'expérience** anti-arnaque

**🎯 Notre mission :** Te faire économiser le maximum !`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'conseil_expert_refap',
    cta: {
      type: 'callback_expert',
      form: {
        fields: ['nom', 'telephone', 'vehicule', 'probleme_detaille', 'urgence'],
        required: ['nom', 'telephone', 'probleme_detaille'],
        title: '📞 Conseil Expert Re-Fap'
      }
    }
  });
}

async function handleFormulaireEnvoi(userData, res) {
  const message = `📦 **ENVOI POSTAL RE-FAP CLERMONT**

**🎯 Service clé en main :**
1. ✅ Tu démontez ton FAP (on t'explique)
2. ✅ Emballage sécurisé (fourni)  
3. ✅ Envoi par transporteur
4. ✅ Nettoyage professionnel Re-Fap
5. ✅ Retour sous 48h

**💰 Prix tout compris : 250€**
*(200€ nettoyage + 50€ transport)*
**💸 Économie : 1750€** vs remplacement

**📦 Kit d'envoi livré chez toi en 24h**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'formulaire_envoi',
    cta: {
      type: 'lead_generation_envoi',
      form: {
        fields: ['nom', 'telephone', 'email', 'adresse_complete', 'vehicule'],
        required: ['nom', 'telephone', 'adresse_complete', 'vehicule'],
        title: '📦 Envoi Postal Re-Fap'
      }
    }
  });
}

async function handleInfosClermont(userData, res) {
  const message = `🏪 **APPORTER TON FAP À CLERMONT**

**📍 Adresse Re-Fap :**
Zone Industrielle de Clermont-Ferrand
📞 04 73 XX XX XX
🕐 Lun-Ven 8h-17h

**🎯 Procédure :**
1. ✅ Tu démontez ton FAP
2. ✅ Tu l'apportes chez nous
3. ✅ Nettoyage pendant que tu attends (2h)
4. ✅ Test + remontage si besoin

**💰 Prix : 200€** (le moins cher)
**⏰ Délai : 2h sur place**

**💡 Prendre RDV recommandé**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'infos_clermont',
    cta: {
      type: 'rdv_apport_direct',
      form: {
        fields: ['nom', 'telephone', 'vehicule', 'date_souhaitee'],
        required: ['nom', 'telephone', 'vehicule'],
        title: '🚗 RDV Apport FAP Clermont'
      }
    }
  });
}

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
1. ✅ Démonte ton FAP
2. ✅ Appelle pour vérifier dispo machine
3. ✅ Prix nettoyage : ~200€

**⚠️ Alternative :** Re-Fap postal (250€ tout compris)`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'localisation_carter_cash',
    cta: {
      type: 'follow_up',
      message: "🔧 **Besoin d'aide pour continuer ?**",
      boutons: [
        { text: "📧 Guide démontage FAP", action: "guide_demontage_fap", data: { type: "guide_technique" } },
        { text: "📦 Solution Re-Fap postal", action: "formulaire_envoi", data: { type: "envoi_postal" } }
      ]
    }
  });
}

async function handleRDVIdgarages(userData, res) {
  const message = `📅 **Prise de RDV idGarages**

🎯 **idGarages - Réseau certifié anti-arnaque**
• ✅ Diagnostic transparent avant intervention
• ✅ Devis détaillé obligatoire
• ✅ Réseau de 2000+ garages

📞 **Un conseiller va t'appeler sous 2h** pour :
• ✅ Trouver le garage le plus proche
• ✅ Fixer un RDV selon tes dispos`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'rdv_idgarages',
    cta: {
      type: 'lead_generation',
      partner: 'idGarages',
      form: {
        fields: ['nom', 'telephone', 'email', 'ville', 'probleme', 'vehicule'],
        required: ['nom', 'telephone', 'ville', 'probleme'],
        title: '📅 RDV idGarages'
      }
    }
  });
}

async function handleDiagnosticLigneComplet(userData, res) {
  const message = `🔍 **DIAGNOSTIC EN LIGNE COMPLET**

**🎯 Questions ciblées pour identifier ton problème :**

**Étape 1/5 - Symptômes principaux**
• Voyants allumés ?
• Bruits anormaux ?
• Perte de puissance ?

**📋 Diagnostic personnalisé en 5 minutes**
**💡 Solutions économiques garanties**

**On commence ?**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'diagnostic_ligne_complet',
    cta: {
      type: 'diagnostic_interactif',
      form: {
        fields: ['vehicule', 'symptomes_principaux', 'voyants', 'bruits', 'performance'],
        required: ['vehicule', 'symptomes_principaux'],
        title: '🔍 Diagnostic En Ligne'
      }
    }
  });
}

async function handleChatExpertDiagnostic(userData, res) {
  const message = `💬 **CHAT AVEC EXPERT DIAGNOSTIC**

**🧠 Expert disponible pour :**
• ✅ Diagnostic en temps réel
• ✅ Questions/réponses immédiates
• ✅ Orientation solution économique
• ✅ Conseil anti-arnaque

**⏰ Disponible maintenant**
**🆓 100% gratuit**

**🎯 Chat sécurisé et confidentiel**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'chat_expert_diagnostic',
    cta: {
      type: 'chat_live',
      form: {
        fields: ['nom', 'vehicule', 'probleme_resume'],
        required: ['nom', 'probleme_resume'],
        title: '💬 Chat Expert'
      }
    }
  });
}

async function handleGuideDiagnosticAutre(userData, res) {
  const message = `📧 **GUIDE DIAGNOSTIC GRATUIT**

**📚 Tu vas recevoir par email :**
• ✅ Checklist diagnostic par problème
• ✅ Questions à poser au garage
• ✅ Prix justes vs arnaques
• ✅ Garages de confiance près de chez toi

**💡 Guide militant anti-arnaque**
**🎯 Économise des centaines d'euros**

**📧 Livraison immédiate**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'guide_diagnostic_autre',
    cta: {
      type: 'email_guide',
      form: {
        fields: ['email', 'prenom', 'probleme_type'],
        required: ['email'],
        title: '📧 Guide Diagnostic'
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

SPÉCIAL FAP : Toujours proposer Re-Fap (280€) vs remplacement (2000€)

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

SPÉCIAL FAP : Propose toujours Re-Fap (280€) vs remplacement (2000€)

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
      baseResponse = `🚨 **ALERTE FAP MILITANT** 🚨

Salut ! Julien à l'appareil, mécano chez Re-Fap depuis 20 ans et militant anti-arnaque !

Ah, le fameux FAP bouché... Laisse-moi deviner : le voyant moteur s'est allumé et la voiture manque de puissance ? C'est malheureusement super courant et certains garagistes en profitent pour te faire changer la pièce direct (**1500-2000€ minimum**)... **Mais on va pas se faire avoir !**

**🔧 SOLUTION RE-FAP CLERMONT :**
• **Nettoyage FAP : 280€** (au lieu de 2000€)
• **Économie : 1720€** 💰
• **Diagnostic gratuit**
• **Garanti 2 ans**

**⚠️ SURTOUT :** Ne te précipite pas chez le concessionnaire ! Dans 80% des cas, un simple nettoyage chez nous suffit.

**Avant tout, quelques questions pour t'aider au mieux :**
- C'est quoi comme voiture (marque, modèle, année) ?
- Tu roules plutôt en ville ou sur route ?
- Le voyant moteur est allumé ?

**💪 Mon conseil militant :** Appelle-nous d'abord, ça peut te faire économiser 1500€ !`;
    } else {
      baseResponse = `🧠 **Expertise FAP Militante** 🌪️

**Mon diagnostic honest :**
Symptômes typiques de FAP colmaté. BONNE NOUVELLE : ça se résout SANS remplacement dans 90% des cas !

**🔧 Solutions Re-Fap (du moins cher au plus cher) :**
1. **Nettoyage Re-Fap** : 280€ ✅ **RECOMMANDÉ**
2. **Service récupération** : 380€ (on vient chercher ta voiture)
3. **Envoi postal** : 250€ (tu démontez)

**❌ Remplacement** : 1800€ = **Arnaque dans 90% des cas**

**Mon conseil militant :** Re-Fap Clermont = économie de 1520€ minimum !`;
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
