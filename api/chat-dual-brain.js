// Intégration du système CTA intelligent dans l'API militante

import { SystemeCTAIntelligent } from './systeme-cta-intelligent.js';

// Instance globale du système CTA
const ctaSystem = new SystemeCTAIntelligent();

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Méthode non autorisée' 
    });
  }

  try {
    const { 
      message, 
      userData = {}, 
      sessionId,
      historique = [],
      action // Nouvelle action pour les CTA
    } = req.body;

    console.log('🤝 API Militante + CTA:', { message: message?.substring(0, 50), action });

    // GESTION DES ACTIONS CTA
    if (action) {
      return await handleCTAAction(action, req.body, res);
    }

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
      return res.status(200).json({
        success: true,
        message: genererReponseEmailConfirme(userEmail),
        cta: genererCTAEmailConfirme(userEmail),
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

    // Appel IA pour générer la réponse technique
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

    // Ajout invitation email si niveau 0 et pas de CTA spécifique
    if (userLevel === 0 && !ctaAnalyse.cta.boutons.some(btn => btn.data.type.includes('email'))) {
      response += genererInvitationEmailBienveillante();
    }

    const needType = detectNeedType(message);
    const baseScore = calculateMilitantScore(needType, mode);
    const leadValue = Math.round(economicValue * 0.15);

    return res.status(200).json({
      success: true,
      message: response,
      
      // 🎯 CTA INTELLIGENT INTÉGRÉ
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
        
        // Tracking CTA
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

// 🎯 GESTION DES ACTIONS CTA
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

// 🏪 LOCALISATION CARTER CASH
async function handleLocalisationCarterCash(userData, res) {
  console.log('🏪 Localisation Carter Cash pour:', userData.ville);
  
  // Base Carter Cash équipés (2 machines actuellement)
  const carterCashEquipes = [
    {
      nom: "Carter Cash Rungis",
      adresse: "Marché de Rungis, 94150 Rungis",
      distance: "À calculer selon ta position",
      telephone: "01 XX XX XX XX",
      horaires: "Lun-Ven 8h-17h"
    },
    {
      nom: "Carter Cash Lyon", 
      adresse: "Zone industrielle, 69000 Lyon",
      distance: "À calculer selon ta position", 
      telephone: "04 XX XX XX XX",
      horaires: "Lun-Ven 8h-17h"
    }
  ];

  const message = `🏪 **Carter Cash équipés machine FAP** (2 en France)

${carterCashEquipes.map(cc => `
📍 **${cc.nom}**
${cc.adresse}
📞 ${cc.telephone}
🕐 ${cc.horaires}
`).join('\n')}

💡 **Étapes suivantes :**
1. Démonte ton FAP ✅
2. Appelle pour vérifier dispo machine
3. Prix nettoyage : ~200€

🤝 **Besoin d'aide pour démonter ?** Je peux t'envoyer le guide !`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'localisation_carter_cash',
    data: {
      carter_cash_list: carterCashEquipes,
      next_steps: ['demontage', 'appel_verification', 'deplacement']
    },
    cta: {
      type: 'follow_up',
      boutons: [
        {
          text: "📧 Guide démontage FAP",
          action: "guide_demontage_fap",
          data: { type: "guide_technique" }
        },
        {
          text: "📞 Aide pour démonter",
          action: "aide_demontage",
          data: { type: "support_technique" }
        }
      ]
    }
  });
}

// 🛠️ LOCALISATION GARAGE RE-FAP
async function handleLocalisationGarageRefap(userData, res) {
  console.log('🛠️ Localisation Garage Re-Fap pour:', userData.ville);
  
  const message = `🛠️ **Garages partenaires Re-Fap près de chez toi**

📍 **Recherche en cours selon ta position...**

💪 **Avantages réseau Re-Fap :**
• Nettoyage FAP garanti 2 ans
• Prix transparent : 200€ max
• Pas d'arnaque remplacement 
• Formation technique Re-Fap

📞 **Pour finaliser :** Laisse-moi tes coordonnées et je te trouve le plus proche !`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'localisation_garage_refap',
    cta: {
      type: 'lead_capture',
      message: "📋 **Coordonnées pour localisation précise**",
      boutons: [
        {
          text: "📞 Me faire rappeler",
          action: "demande_rappel_localisation",
          data: { type: "rappel_localisation_garage" }
        }
      ],
      form: {
        fields: ['nom', 'telephone', 'ville', 'code_postal'],
        required: ['nom', 'telephone', 'ville']
      }
    }
  });
}

// 📅 RDV IDGARAGES
async function handleRDVIdgarages(userData, res) {
  console.log('📅 RDV idGarages pour:', userData.ville);
  
  const message = `📅 **Prise de RDV idGarages**

🎯 **idGarages - Réseau certifié anti-arnaque**
• Diagnostic transparent avant intervention
• Devis détaillé obligatoire
• Garantie satisfaction client
• Réseau de 2000+ garages

📞 **Je transmets ta demande à idGarages**
Un conseiller va t'appeler sous 2h pour :
• Trouver le garage le plus proche
• Fixer un RDV selon tes dispos
• T'expliquer la procédure

💪 **Fini les arnaques !**`;

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

// 📦 FORMULAIRE ENVOI POSTAL
async function handleFormulaireEnvoi(userData, res) {
  const message = `📦 **Envoi postal Re-Fap Clermont**

🎯 **Service clé en main :**
1. Tu démontez ton FAP
2. Emballage sécurisé (on t'explique)  
3. Envoi par transporteur
4. Nettoyage professionnel Re-Fap
5. Retour sous 48h

💰 **Prix tout compris :** 250€ (nettoyage + transport)

📋 **On s'occupe de tout organiser !**`;

  return res.status(200).json({
    success: true,
    message,
    action_completed: 'formulaire_envoi',
    cta: {
      type: 'lead_generation_envoi',
      message: "📋 **Formulaire envoi postal Re-Fap**",
      form: {
        fields: ['nom', 'telephone', 'email', 'adresse_complete', 'vehicule', 'urgence'],
        required: ['nom', 'telephone', 'adresse_complete', 'vehicule']
      }
    }
  });
}

// 📞 DEMANDE RAPPEL FAP
async function handleDemandeRappelFAP(userData, res) {
  const message = `📞 **Rappel Expert FAP Re-Fap**

🧠 **Un expert FAP va t'appeler :**
• Diagnostic approfondi de ton cas
• Solutions personnalisées  
• Orientation vers la meilleure option
• Conseils techniques gratuits

⏰ **Sous combien de temps ?** 
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
        fields: ['nom', 'telephone', 'email', 'vehicule', 'probleme_detaille', 'urgence'],
        required: ['nom', 'telephone', 'probleme_detaille']
      }
    }
  });
}

// 📧 EMAIL SUIVI DIAGNOSTIC
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
      },
      sequence: 'diagnostic_fap_suivi'
    }
  });
}

// === UTILITAIRES ===

function genererCTAEmailConfirme(email) {
  return {
    type: 'email_confirmed',
    message: "🎉 **Email confirmé ! Tu vas recevoir :**",
    boutons: [
      {
        text: "🔧 Continuer le diagnostic",
        action: "continuer_diagnostic",
        data: { email_confirmed: true }
      }
    ]
  };
}

// Fonctions existantes conservées...
async function callClaudeMilitant(message, userLevel) {
  // Code existant...
}

function genererReponseEmailConfirme(email) {
  // Code existant...
}

// Etc... (garder toutes les fonctions existantes)
