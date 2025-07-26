// Système de CTA Intelligent - Orientation Multi-Parcours Re-Fap

export class SystemeCTAIntelligent {
  constructor() {
    this.parcoursUtilisateur = new Map();
    this.historiqueCTA = new Map();
    
    // Configuration des parcours
    this.parcours = {
      // 🌪️ PARCOURS FAP
      fap_confirme: {
        name: "FAP Confirmé",
        triggers: ["fap", "antipollution", "p2002", "p2463", "fumee noire", "perte puissance ville"],
        sous_parcours: ["diagnostic_requis", "bricoleur_confirme", "garage_direct"]
      },
      
      // 🔧 PARCOURS AUTRE (non-FAP)
      autre_probleme: {
        name: "Autre Problème",
        triggers: ["frein", "embrayage", "courroie", "alternateur", "demarrage"],
        sous_parcours: ["diagnostic_ligne", "rdv_partenaire"]
      },
      
      // ❓ PARCOURS INCERTAIN
      diagnostic_necessaire: {
        name: "Diagnostic Nécessaire", 
        triggers: ["voyant", "bruit", "vibration", "pas sur"],
        sous_parcours: ["qualification_probleme", "orientation_expert"]
      }
    };

    // Configuration CTA par sous-parcours
    this.ctaConfig = this.initCTAConfig();
  }

  // 🎯 ANALYSE ET ORIENTATION PRINCIPALE
  analyserEtOrienter(message, historique, userData = {}) {
    console.log('🎯 Analyse CTA pour:', message.substring(0, 50));
    
    // 1. Détection du parcours principal
    const parcoursDetecte = this.detecterParcoursPrincipal(message, historique);
    
    // 2. Analyse du niveau de certitude
    const niveauCertitude = this.analyserCertitude(message, historique);
    
    // 3. Détection profil utilisateur (bricoleur vs particulier)
    const profilUtilisateur = this.detecterProfilUtilisateur(message, historique, userData);
    
    // 4. Sélection du sous-parcours optimal
    const sousParcours = this.selectionnerSousParcours(parcoursDetecte, niveauCertitude, profilUtilisateur);
    
    // 5. Génération CTA personnalisé
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
    
    // Analyse des mots-clés FAP (priorité 1)
    const motsFAP = [
      'fap', 'filtre particule', 'antipollution', 'egr', 'adblue',
      'p2002', 'p2463', 'fumee noire', 'perte puissance ville',
      'mode degrade', 'regeneration', 'suie'
    ];
    
    const scoreFAP = motsFAP.filter(mot => contexteComplet.includes(mot)).length;
    
    // Analyse problèmes autres (priorité 2)
    const motsAutres = [
      'frein', 'embrayage', 'courroie', 'alternateur', 'demarrage',
      'direction', 'suspension', 'transmission', 'climatisation'
    ];
    
    const scoreAutres = motsAutres.filter(mot => contexteComplet.includes(mot)).length;
    
    // Analyse incertitude (priorité 3)
    const motsIncertains = [
      'voyant', 'bruit', 'vibration', 'pas sur', 'sais pas',
      'probleme', 'panne', 'bizarre', 'etrange'
    ];
    
    const scoreIncertain = motsIncertains.filter(mot => contexteComplet.includes(mot)).length;
    
    // Logique de décision
    if (scoreFAP > 0) {
      return 'fap_confirme';
    } else if (scoreAutres > scoreIncertain) {
      return 'autre_probleme';
    } else {
      return 'diagnostic_necessaire';
    }
  }

  // 📊 ANALYSE NIVEAU DE CERTITUDE
  analyserCertitude(message, historique) {
    const contexte = (message + ' ' + historique.join(' ')).toLowerCase();
    
    // Indicateurs de certitude élevée
    const indicateursCertains = [
      'code erreur', 'diagnostic fait', 'garage dit', 'confirme',
      'sur que', 'certain', 'evidemment', 'clairement'
    ];
    
    // Indicateurs d'incertitude
    const indicateursIncertains = [
      'peut etre', 'sais pas', 'pas sur', 'bizarre', 'etrange',
      'jamais vu', 'premiere fois', 'aide moi'
    ];
    
    const certains = indicateursCertains.filter(ind => contexte.includes(ind)).length;
    const incertains = indicateursIncertains.filter(ind => contexte.includes(ind)).length;
    
    if (certains > incertains) return 'elevee';
    if (incertains > 2) return 'faible';
    return 'moyenne';
  }

  // 👤 DÉTECTION PROFIL UTILISATEUR
  detecterProfilUtilisateur(message, historique, userData) {
    const contexte = (message + ' ' + historique.join(' ')).toLowerCase();
    
    // Indicateurs bricoleur
    const indicateursBricoleur = [
      'demonte', 'bricoleur', 'repare moi', 'outillage', 'mecanique',
      'fais moi meme', 'autonome', 'diy', 'tuto', 'guide reparation'
    ];
    
    // Indicateurs particulier standard
    const indicateursParticulier = [
      'garage', 'mecanicien', 'reparateur', 'faire reparer',
      'combien ca coute', 'devis', 'rdv', 'rendez-vous'
    ];
    
    const scoreBricoleur = indicateursBricoleur.filter(ind => contexte.includes(ind)).length;
    const scoreParticulier = indicateursParticulier.filter(ind => contexte.includes(ind)).length;
    
    // Analyse du profil selon l'historique
    if (userData.interactions > 3 && scoreBricoleur > 0) return 'bricoleur_confirme';
    if (scoreBricoleur > scoreParticulier) return 'bricoleur_potentiel';
    if (scoreParticulier > 0) return 'particulier_standard';
    return 'indetermine';
  }

  // 🎯 SÉLECTION SOUS-PARCOURS
  selectionnerSousParcours(parcours, certitude, profil) {
    const matrix = {
      // PARCOURS FAP
      fap_confirme: {
        elevee: {
          bricoleur_confirme: 'fap_bricoleur_direct',
          bricoleur_potentiel: 'fap_bricoleur_orientation', 
          particulier_standard: 'fap_garage_direct',
          indetermine: 'fap_qualification_profil'
        },
        moyenne: {
          bricoleur_confirme: 'fap_diagnostic_bricoleur',
          bricoleur_potentiel: 'fap_diagnostic_orientation',
          particulier_standard: 'fap_diagnostic_garage',
          indetermine: 'fap_diagnostic_general'
        },
        faible: {
          all: 'fap_diagnostic_requis_suivi'
        }
      },
      
      // PARCOURS AUTRE
      autre_probleme: {
        elevee: {
          all: 'autre_rdv_partenaire_direct'
        },
        moyenne: {
          all: 'autre_diagnostic_ligne_puis_rdv'
        },
        faible: {
          all: 'autre_qualification_puis_orientation'
        }
      },
      
      // PARCOURS DIAGNOSTIC
      diagnostic_necessaire: {
        all: {
          all: 'diagnostic_qualification_complete'
        }
      }
    };

    // Navigation dans la matrice
    const parcoursMatrix = matrix[parcours];
    if (!parcoursMatrix) return 'fallback_orientation_generale';
    
    const certitudeMatrix = parcoursMatrix[certitude] || parcoursMatrix['moyenne'] || parcoursMatrix['all'];
    if (!certitudeMatrix) return 'fallback_orientation_generale';
    
    return certitudeMatrix[profil] || certitudeMatrix['all'] || 'fallback_orientation_generale';
  }

  // 💎 GÉNÉRATION CTA PERSONNALISÉ
  genererCTA(sousParcours, contexte) {
    const config = this.ctaConfig[sousParcours] || this.ctaConfig['fallback'];
    
    return {
      type: config.type,
      priorite: config.priorite,
      message: this.personnaliserMessage(config.message, contexte),
      boutons: config.boutons.map(btn => ({
        ...btn,
        text: this.personnaliserMessage(btn.text, contexte),
        data: { ...btn.data, ...contexte.tracking }
      })),
      suivi: config.suivi,
      conversion_tracking: {
        parcours: contexte.parcours,
        sous_parcours: sousParcours,
        profil: contexte.profil,
        certitude: contexte.certitude
      }
    };
  }

  // ⚙️ CONFIGURATION CTA PAR SOUS-PARCOURS
  initCTAConfig() {
    return {
      // 🔧 FAP BRICOLEUR DIRECT
      fap_bricoleur_direct: {
        type: 'conversion_immediate',
        priorite: 'haute',
        message: `🔧 **Tu veux démonter ton FAP toi-même ?** Parfait ! 

**Tes options pour le nettoyage :**
• **Carter Cash équipé** (2 machines en France)
• **Re-Fap Clermont** (tu l'apportes) 
• **Envoi postal** (on s'occupe de tout)

💪 **Quel mode préfères-tu ?**`,
        boutons: [
          {
            text: "🏪 Carter Cash près de moi",
            action: "localiser_carter_cash",
            data: { type: "carter_cash_localisation" },
            conversion: "carter_cash_lead"
          },
          {
            text: "🚗 Apporter à Clermont", 
            action: "infos_clermont",
            data: { type: "clermont_depot" },
            conversion: "clermont_lead"
          },
          {
            text: "📦 Envoi postal Re-Fap",
            action: "formulaire_envoi",
            data: { type: "envoi_postal" },
            conversion: "envoi_lead"
          }
        ],
        suivi: {
          email_requis: true,
          relance: "24h",
          type: "bricoleur_fap"
        }
      },

      // 🏥 FAP DIAGNOSTIC REQUIS + SUIVI  
      fap_diagnostic_requis_suivi: {
        type: 'nurturing_conversion',
        priorite: 'moyenne',
        message: `🔍 **Pour confirmer que c'est bien le FAP, diagnostic garage recommandé.**

**Plan d'action intelligent :**
1️⃣ **Diagnostic chez un partenaire** (60-80€)
2️⃣ **Reste en contact avec nous** pendant le diagnostic  
3️⃣ **On t'oriente selon le résultat** (nettoyage vs remplacement)

💡 **Astuce militant :** Dis au garage "je veux juste le diagnostic, pas la réparation"`,
        boutons: [
          {
            text: "🔍 Garage diagnostic près de moi",
            action: "localiser_garage_diagnostic", 
            data: { type: "diagnostic_partenaire" },
            conversion: "diagnostic_lead"
          },
          {
            text: "📧 Rester en contact (guide suivi)",
            action: "email_suivi_diagnostic",
            data: { type: "nurturing_fap" },
            conversion: "email_nurturing"
          }
        ],
        suivi: {
          email_requis: true,
          relance: "48h_post_diagnostic",
          type: "fap_diagnostic_suivi",
          nurturing_sequence: [
            "guide_questions_poser_garage",
            "que_faire_selon_diagnostic", 
            "solutions_economiques_fap"
          ]
        }
      },

      // 🚗 FAP GARAGE DIRECT
      fap_garage_direct: {
        type: 'conversion_immediate',
        priorite: 'haute', 
        message: `🚗 **Ton FAP a besoin d'attention !**

**Solutions Re-Fap près de chez toi :**
• **Nettoyage FAP** (200€) vs remplacement (2000€)
• **Garages partenaires** formés Re-Fap
• **Garantie** sur le nettoyage

⚡ **On trouve le plus proche de chez toi ?**`,
        boutons: [
          {
            text: "🛠️ Garage Re-Fap près de moi",
            action: "localiser_garage_refap",
            data: { type: "garage_refap" },
            conversion: "garage_refap_lead"
          },
          {
            text: "📞 Rappel expert (gratuit)",
            action: "demande_rappel_fap",
            data: { type: "rappel_expert_fap" },
            conversion: "rappel_lead" 
          }
        ],
        suivi: {
          email_requis: false,
          relance: "immédiate",
          type: "fap_garage_direct"
        }
      },

      // 🔧 AUTRE PROBLÈME → RDV PARTENAIRE
      autre_rdv_partenaire_direct: {
        type: 'conversion_partenaire',
        priorite: 'haute',
        message: `🔧 **Problème identifié !** 

**Solution :** Diagnostic chez un partenaire de confiance
• **idGarages** : Réseau certifié anti-arnaque
• **Devis transparent** avant intervention
• **Intervention rapide** selon diagnostic

📞 **On te trouve un créneau ?**`,
        boutons: [
          {
            text: "📅 RDV idGarages près de moi",
            action: "rdv_idgarages", 
            data: { type: "rdv_idgarages" },
            conversion: "idgarages_lead"
          },
          {
            text: "📧 Guide diagnostic (gratuit)",
            action: "guide_diagnostic_autre",
            data: { type: "guide_autre_probleme" },
            conversion: "email_autre"
          }
        ],
        suivi: {
          email_requis: true,
          relance: "24h", 
          type: "autre_probleme_suivi"
        }
      },

      // ❓ DIAGNOSTIC QUALIFICATION COMPLÈTE
      diagnostic_qualification_complete: {
        type: 'qualification_conversion',
        priorite: 'moyenne',
        message: `❓ **On va identifier ton problème ensemble !**

**Diagnostic en ligne Re-Fap :**
• **Questions ciblées** pour cerner le souci
• **Solutions économiques** selon diagnostic
• **Orientation experte** vers la bonne solution

🎯 **Quelques questions précises et on y voit clair !**`,
        boutons: [
          {
            text: "🔍 Diagnostic en ligne (5 min)",
            action: "diagnostic_ligne_complet",
            data: { type: "diagnostic_ligne" },
            conversion: "diagnostic_online"
          },
          {
            text: "💬 Chat avec expert",
            action: "chat_expert_diagnostic", 
            data: { type: "chat_expert" },
            conversion: "chat_expert_lead"
          }
        ],
        suivi: {
          email_requis: true,
          relance: "6h",
          type: "diagnostic_qualification"
        }
      },

      // 🆘 FALLBACK GÉNÉRAL
      fallback: {
        type: 'orientation_generale',
        priorite: 'basse',
        message: `🤝 **Je suis là pour t'aider !**

**Plusieurs façons de continuer :**
• **Diagnostic gratuit** en ligne  
• **Contact expert** Re-Fap
• **Recherche garage** de confiance

💪 **Dis-moi ce qui t'aiderait le plus !**`,
        boutons: [
          {
            text: "🔍 Diagnostic gratuit",
            action: "diagnostic_general",
            data: { type: "diagnostic_general" },
            conversion: "diagnostic_fallback"
          },
          {
            text: "🛠️ Garages de confiance",
            action: "localiser_garages",
            data: { type: "garages_confiance" },
            conversion: "garage_fallback"
          }
        ],
        suivi: {
          email_requis: true,
          relance: "24h",
          type: "orientation_generale"
        }
      }
    };
  }

  // 📝 PERSONNALISATION DES MESSAGES
  personnaliserMessage(template, contexte) {
    return template
      .replace(/\{ville\}/g, contexte.userData?.ville || 'ta région')
      .replace(/\{prenom\}/g, contexte.userData?.prenom || '')
      .replace(/\{vehicule\}/g, contexte.userData?.vehicule || 'ta voiture');
  }

  // 📊 TRACKING DES CONVERSIONS
  trackConversion(cta, action, userData) {
    const conversionData = {
      timestamp: new Date().toISOString(),
      parcours: cta.conversion_tracking.parcours,
      sous_parcours: cta.conversion_tracking.sous_parcours,
      profil: cta.conversion_tracking.profil,
      action: action,
      conversion_type: this.getConversionType(action),
      user_data: userData,
      session_id: userData.sessionId
    };

    // Log pour analytics
    console.log('📈 Conversion tracked:', conversionData);
    
    // Ici vous pourriez envoyer vers votre système d'analytics
    return conversionData;
  }

  // 🎯 TYPES DE CONVERSION
  getConversionType(action) {
    const conversionTypes = {
      'carter_cash_localisation': 'carter_cash_lead',
      'clermont_depot': 'clermont_direct_lead', 
      'envoi_postal': 'envoi_postal_lead',
      'localiser_garage_refap': 'garage_refap_lead',
      'rdv_idgarages': 'idgarages_lead',
      'demande_rappel_fap': 'rappel_expert_lead',
      'email_suivi_diagnostic': 'nurturing_lead'
    };
    
    return conversionTypes[action] || 'generic_lead';
  }
}

export default SystemeCTAIntelligent;
