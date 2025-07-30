// api/chat-dual-brain.js - Backend optimisé avec réponses directes + CTA intelligents

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration CTA Re-Fap
const CTA_CONFIG = {
  refap: {
    baseUrl: 'https://re-fap.fr',
    carterCash: 'https://www.auto.re-fap.fr',
    diagnostic: 'https://re-fap.fr/diagnostic-gratuit',
    centres: 'https://re-fap.fr/centres',
    garagePartner: 'https://re-fap.fr/trouver_garage_partenaire',
    contact: 'mailto:support@re-fap.fr',
    phone: 'tel:+33123456789'
  },
  prices: {
    fapCatalyseur: 149,
    fapSimple: 99,
    diagnostic: 0
  }
};
// 🎯 DÉTECTION AMÉLIORÉE - Symptômes spécifiques

class ProblemDetector {
  static analyze(message) {
    const text = message.toLowerCase();
    
    const patterns = {
      egr_fap_combined: [
        // Voyants spécifiques EGR/FAP
        'voyant préchauffage clignotant', 'voyant préchauffage qui clignote',
        'préchauffage clignote', 'témoin préchauffage clignotant',
        'voyant bougie de préchauffage', 'témoin bougie préchauffage',
        
        // Symptômes EGR + perte puissance
        'perte de puissance voyant', 'plus de puissance voyant',
        'bridé voyant', 'mode dégradé voyant',
        
        // Combinaisons spécifiques Golf TDI
        'golf tdi perte puissance', 'golf tdi voyant',
        'tdi 140 perte puissance', 'tdi voyant préchauffage'
      ],
      
      fap_confirmed: [
        'voyant fap', 'fap allumé', 'fap rouge', 'témoin fap',
        'filtre à particules', 'fap bouché', 'fap colmaté',
        'régénération fap', 'nettoyage fap'
      ],
      
      egr_adblu: [
        'voyant egr', 'egr bouché', 'valve egr',
        'adblue', 'ad blue', 'urée', 'scr',
        'nox', 'dépollution'
      ],
      
      fap_probable: [
        'fumée noire', 'fumées noires', 'fumée épaisse',
        'perte de puissance', 'moteur bride', 'mode dégradé',
        'à-coups moteur', 'ralenti instable'
      ],
      
      urgence: [
        'moteur coupé', 'arrêt moteur', 'ne démarre plus',
        'surchauffe', 'température rouge', 'huile rouge',
        'bruit anormal', 'claquement moteur'
      ],
      
      autres: [
        'freins', 'frein', 'embrayage', 'boite vitesse',
        'direction', 'suspension', 'climatisation',
        'électricité', 'batterie', 'alternateur'
      ]
    };

    const scores = {};
    
    for (const [category, keywords] of Object.entries(patterns)) {
      scores[category] = keywords.filter(keyword => 
        text.includes(keyword)
      ).length;
    }

    // Retourner la catégorie avec le score le plus élevé
    const maxCategory = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );

    return {
      category: maxCategory,
      confidence: scores[maxCategory],
      allScores: scores
    };
  }

  // Nouvelle fonction pour détecter les modèles de véhicules
  static detectVehicleInfo(message) {
    const text = message.toLowerCase();
    
    const vehiclePatterns = {
      golf_tdi: ['golf tdi', 'golf 2.0 tdi', 'golf tdi 140'],
      audi_tdi: ['audi tdi', 'a3 tdi', 'a4 tdi', 'q5 tdi'],
      bmw_diesel: ['bmw diesel', '320d', '520d', 'x3 diesel'],
      mercedes_diesel: ['mercedes diesel', 'c220d', 'e220d'],
      peugeot_diesel: ['peugeot diesel', '308 diesel', '508 diesel'],
      renault_diesel: ['renault diesel', 'megane diesel', 'scenic diesel']
    };

    for (const [brand, patterns] of Object.entries(vehiclePatterns)) {
      if (patterns.some(pattern => text.includes(pattern))) {
        return brand;
      }
    }

    return 'unknown';
  }
}

// 🎯 CTA SPÉCIALISÉ pour EGR/FAP combiné
class CTAGenerator {
  // Nouvelle fonction pour EGR + FAP combiné
  static generateEGRFAPCombinedCTA() {
    return {
      title: '🔬 Diagnostic EGR/FAP Spécialisé',
      message: 'Voyant préchauffage clignotant = problème EGR/capteurs. Diagnostic gratuit Re-Fap pour identifier la cause exacte !',
      buttons: [
        {
          text: '📅 Diagnostic gratuit EGR/FAP',
          url: CTA_CONFIG.refap.diagnostic,
          type: 'primary'
        },
        {
          text: '🔬 Expertise capteurs',
          url: CTA_CONFIG.refap.baseUrl + '/diagnostic-capteurs',
          type: 'secondary'
        },
        {
          text: '📞 Expert EGR immédiat',
          url: CTA_CONFIG.refap.phone,
          type: 'info'
        }
      ]
    };
  }

  static generate(problemCategory, technicalLevel, confidence, vehicleInfo) {
    switch (problemCategory) {
      case 'egr_fap_combined':
        return this.generateEGRFAPCombinedCTA();
      
      case 'fap_confirmed':
        return this.generateFAPConfirmedCTA(technicalLevel);
      
      case 'fap_probable':
        return this.generateFAPProbableCTA();
      
      case 'egr_adblu':
        return this.generateEGRAdBlueCTA();
      
      case 'urgence':
        return this.generateUrgenceCTA();
      
      case 'autres':
        return this.generateAutresCTA();
      
      default:
        return this.generateDiagnosticCTA();
    }
  }
}

// 🎯 PROMPTS AMÉLIORÉS avec expertise spécifique
const ENHANCED_PROMPTS = {
  brain1: `Tu es Julien, expert FAP/EGR/AdBlue depuis 20 ans chez Re-Fap.

EXPERTISE SPÉCIFIQUE :
- Voyant préchauffage clignotant = souvent EGR/capteurs, PAS turbo
- Golf TDI 140 2008 = problèmes EGR fréquents
- Perte puissance + voyant préchauffage = EGR/FAP à diagnostiquer
- Capteurs pression différentielle FAP souvent défaillants

RÈGLES :
- Diagnostic PRÉCIS basé sur l'expertise Re-Fap
- Si voyant préchauffage clignotant → suspecter EGR/capteurs
- Réponse max 30 mots
- Orienté spécialité Re-Fap

EXEMPLE CORRECT pour "Golf TDI perte puissance voyant préchauffage" :
"Voyant préchauffage clignotant Golf TDI = souvent EGR/capteurs. Diagnostic Re-Fap spécialisé nécessaire."`,

  brain2: `Tu es l'assistant commercial Re-Fap, expert en closing.

ARGUMENTS COMMERCIAUX SPÉCIFIQUES :
- Diagnostic gratuit Re-Fap = identification précise
- EGR/capteurs = spécialité Re-Fap, pas garage généraliste
- Économies vs remplacement complet
- Expertise constructeur sur Golf TDI

RÈGLES :
- Push vers diagnostic gratuit Re-Fap
- Mettre en avant l'expertise spécialisée
- Max 25 mots
- Urgence d'agir avant aggravation

EXEMPLE pour problème EGR :
"Diagnostic gratuit Re-Fap = expertise EGR. Évitez garage généraliste, choisissez spécialiste."`
};

// 🎯 FONCTION PRINCIPALE MODIFIÉE
function getEnhancedPrompts(problemCategory, technicalLevel, vehicleInfo) {
  let contextSpecifique = '';
  
  if (problemCategory === 'egr_fap_combined') {
    contextSpecifique = `
CONTEXTE SPÉCIFIQUE : Voyant préchauffage clignotant + perte puissance
VÉHICULE : ${vehicleInfo}
DIAGNOSTIC : Probable EGR/capteurs, pas turbo/injecteurs
ORIENTATION : Diagnostic gratuit Re-Fap spécialisé EGR/FAP`;
  }

  return {
    brain1: `${ENHANCED_PROMPTS.brain1}${contextSpecifique}`,
    brain2: `${ENHANCED_PROMPTS.brain2}${contextSpecifique}`
  };
}
  static detectTechnicalLevel(message) {
    const text = message.toLowerCase();
    
    const indicators = {
      bricoleur: [
        'je démonte', 'démonter moi-même', 'bricoleur',
        'j\'ai des outils', 'garage maison', 'mécano amateur',
        'je peux démonter', 'je sais faire', 'avec mes outils'
      ],
      debutant: [
        'je ne sais pas', 'débutant', 'première fois',
        'jamais fait', 'pas doué', 'peur de casser',
        'aucune idée', 'connais rien', 'pas sûr'
      ]
    };

    for (const [level, keywords] of Object.entries(indicators)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return level;
      }
    }

    return 'intermediaire'; // niveau par défaut
  }
}

// Générateur de CTA contextuels
class CTAGenerator {
  static generate(problemCategory, technicalLevel, confidence) {
    switch (problemCategory) {
      case 'fap_confirmed':
        return this.generateFAPConfirmedCTA(technicalLevel);
      
      case 'fap_probable':
        return this.generateFAPProbableCTA();
      
      case 'egr_adblu':
        return this.generateEGRAdBlueCTA();
      
      case 'urgence':
        return this.generateUrgenceCTA();
      
      case 'autres':
        return this.generateAutresCTA();
      
      default:
        return this.generateDiagnosticCTA();
    }
  }

  static generateFAPConfirmedCTA(technicalLevel) {
    switch (technicalLevel) {
      case 'bricoleur':
        return {
          title: '🔧 Solution Bricoleur - Carter-Cash',
          message: 'Tu peux démonter ton FAP ? Carter-Cash près de chez toi le nettoie pendant que tu attends !',
          buttons: [
            {
              text: '🏪 Trouver Carter-Cash',
              url: CTA_CONFIG.refap.carterCash,
              type: 'primary'
            },
            {
              text: '📱 Kit démontage Re-Fap',
              url: CTA_CONFIG.refap.baseUrl + '/kit-demontage',
              type: 'secondary'
            }
          ]
        };

      case 'debutant':
        return {
          title: '🏆 Service Complet - Garage Partenaire',
          message: 'Pas de stress ! Nos garages partenaires s\'occupent de tout : dépose, nettoyage, repose.',
          buttons: [
            {
              text: '🔍 Trouver un garage partenaire',
              url: CTA_CONFIG.refap.garagePartner,
              type: 'primary'
            },
            {
              text: '💬 Aide personnalisée',
              url: CTA_CONFIG.refap.contact,
              type: 'info'
            }
          ]
        };

      default: // intermédiaire
        return {
          title: '⚡ Choix Optimal - Envoi Direct',
          message: `Envoi direct chez Re-Fap : FAP simple ${CTA_CONFIG.prices.fapSimple}€, FAP catalyseur ${CTA_CONFIG.prices.fapCatalyseur}€ (hors port)`,
          buttons: [
            {
              text: '📦 Organiser l\'envoi',
              url: CTA_CONFIG.refap.baseUrl + '/envoi-direct',
              type: 'primary'
            },
            {
              text: '🏪 Ou Carter-Cash',
              url: CTA_CONFIG.refap.carterCash,
              type: 'secondary'
            },
            {
              text: '🔧 Ou garage partenaire',
              url: CTA_CONFIG.refap.garagePartner,
              type: 'info'
            }
          ]
        };
    }
  }

  static generateFAPProbableCTA() {
    return {
      title: '🎯 Diagnostic Gratuit Recommandé',
      message: 'Tes symptômes peuvent indiquer un problème FAP. Diagnostic gratuit pour confirmer avant de payer !',
      buttons: [
        {
          text: '📅 Diagnostic gratuit',
          url: CTA_CONFIG.refap.diagnostic,
          type: 'primary'
        },
        {
          text: '📍 Centres Re-Fap',
          url: CTA_CONFIG.refap.centres,
          type: 'secondary'
        }
      ]
    };
  }

  static generateEGRAdBlueCTA() {
    return {
      title: '🛠️ Expertise EGR/AdBlue Re-Fap',
      message: 'Spécialistes EGR et AdBlue ! Diagnostic précis et solutions adaptées à ton véhicule.',
      buttons: [
        {
          text: '🔬 Diagnostic EGR/AdBlue',
          url: CTA_CONFIG.refap.baseUrl + '/egr-adblue',
          type: 'primary'
        },
        {
          text: '📞 Expert au téléphone',
          url: CTA_CONFIG.refap.phone,
          type: 'secondary'
        }
      ]
    };
  }

  static generateUrgenceCTA() {
    return {
      title: '🚨 Situation d\'Urgence',
      message: 'ATTENTION : Arrête-toi en sécurité ! Contacte immédiatement un garage ou dépanneur.',
      buttons: [
        {
          text: '🆘 Dépannage d\'urgence',
          url: 'tel:15',
          type: 'warning'
        },
        {
          text: '📞 Support Re-Fap',
          url: CTA_CONFIG.refap.phone,
          type: 'info'
        }
      ]
    };
  }

  static generateAutresCTA() {
    return {
      title: '🔧 Garage Partenaire Recommandé',
      message: 'Ce problème sort de notre spécialité FAP/EGR/AdBlue. Nos garages partenaires peuvent t\'aider !',
      buttons: [
        {
          text: '🏪 Trouver un garage',
          url: CTA_CONFIG.refap.garagePartner,
          type: 'primary'
        },
        {
          text: '💬 Confirmer le diagnostic',
          url: CTA_CONFIG.refap.contact,
          type: 'secondary'
        }
      ]
    };
  }

  static generateDiagnosticCTA() {
    return {
      title: '🔍 Diagnostic Personnalisé',
      message: 'Pas sûr de ton problème ? Diagnostic gratuit pour identifier précisément la panne.',
      buttons: [
        {
          text: '📅 Prendre RDV diagnostic',
          url: CTA_CONFIG.refap.diagnostic,
          type: 'primary'
        },
        {
          text: '📱 Chat avec expert',
          url: CTA_CONFIG.refap.contact,
          type: 'secondary'
        }
      ]
    };
  }
}

// 🎯 PROMPTS OPTIMISÉS - ULTRA DIRECTS
const PROMPTS = {
  brain1: `Tu es Julien, expert FAP/EGR/AdBlue depuis 20 ans chez Re-Fap.

RÈGLES STRICTES :
- Réponse ULTRA COURTE (max 30 mots)
- Diagnostic DIRECT et PRÉCIS
- PAS de questions multiples
- PAS de longs développements
- Focus sur le PROBLÈME + SOLUTION
- Ton expert et confiant

EXEMPLES :
"FAP bouché confirmé. Carter-Cash optimal pour bricoleurs."
"Symptômes FAP probable. Diagnostic gratuit Re-Fap recommandé."
"EGR défaillant. Expertise Re-Fap nécessaire."

TONALITÉ : Expert direct, pas de blabla.`,

  brain2: `Tu es l'assistant commercial Re-Fap, expert en closing.

RÈGLES STRICTES :
- Réponse ULTRA COURTE (max 25 mots)
- PUSH immédiat vers les solutions Re-Fap
- Mettre en avant les BÉNÉFICES économiques
- Créer l'URGENCE d'agir
- Langage COMMERCIAL et PERCUTANT

EXEMPLES :
"Nettoyage 99€ vs remplacement 2000€+. Économie garantie."
"Carter-Cash + Re-Fap = combo parfait bricoleurs."
"Diagnostic gratuit = zéro risque financier."

TONALITÉ : Commercial direct, orienté action immédiate.`
};

// Fonction pour obtenir des prompts spécialisés selon le contexte
function getOptimizedPrompts(problemCategory, technicalLevel) {
  const specializedPrompts = {
    brain1: `${PROMPTS.brain1}

CONTEXTE SPÉCIFIQUE : ${problemCategory}, niveau ${technicalLevel}
Réponse directe et solution immédiate en 30 mots max.`,

    brain2: `${PROMPTS.brain2}

CONTEXTE COMMERCIAL : Push vers solution Re-Fap pour ${problemCategory}
Bénéfices économiques en 25 mots max.`
  };

  return specializedPrompts;
}

// Fonction principale de chat
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Étape 1 : Analyse du problème
    const problemAnalysis = ProblemDetector.analyze(message);
    const technicalLevel = ProblemDetector.detectTechnicalLevel(message);

    console.log('🔍 Analyse:', { problemAnalysis, technicalLevel });

    // Étape 2 : Obtenir les prompts optimisés
    const optimizedPrompts = getOptimizedPrompts(problemAnalysis.category, technicalLevel);

    // Étape 3 : Brain 1 - Diagnostic technique Julien (OPTIMISÉ)
    const brain1Response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: optimizedPrompts.brain1 },
        { role: "user", content: message }
      ],
      max_tokens: 60,  // ✅ COURT ET DIRECT
      temperature: 0.1  // ✅ PLUS PRÉVISIBLE
    });

    const technicalDiagnosis = brain1Response.choices[0].message.content;

    // Étape 4 : Brain 2 - Conseil commercial Re-Fap (OPTIMISÉ)
    const brain2Response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: optimizedPrompts.brain2 },
        { 
          role: "user", 
          content: `DIAGNOSTIC JULIEN: ${technicalDiagnosis}
          
          MESSAGE CLIENT: ${message}
          
          CONTEXTE: ${problemAnalysis.category}, niveau ${technicalLevel}
          
          Réponse commerciale Re-Fap ultra-directe en 25 mots max.`
        }
      ],
      max_tokens: 50,   // ✅ ENCORE PLUS COURT
      temperature: 0.1  // ✅ PRÉVISIBLE
    });

    const commercialAdvice = brain2Response.choices[0].message.content;

    // Étape 5 : Génération du CTA approprié
    const cta = CTAGenerator.generate(
      problemAnalysis.category, 
      technicalLevel, 
      problemAnalysis.confidence
    );

    // Étape 6 : Fusion des réponses OPTIMISÉE
    const finalResponse = `🧠 **Diagnostic Re-Fap Express** ⚡

✅ **Julien :** ${technicalDiagnosis}

💡 **Re-Fap :** ${commercialAdvice}

🎯 **Ta solution :** ⬇️`;

    // Log pour analytics
    console.log('🎯 Conversion tracking:', {
      problemCategory: problemAnalysis.category,
      technicalLevel,
      ctaType: cta.title,
      timestamp: new Date().toISOString()
    });

    // ✅ RÉPONSE OPTIMISÉE avec CTA
    return res.status(200).json({
      message: finalResponse,
      cta: cta,
      metadata: {
        problemCategory: problemAnalysis.category,
        technicalLevel,
        confidence: problemAnalysis.confidence,
        aiMode: "🧠 Dual Brain Express",
        userLevel: 1,
        levelName: "Diagnostic Avancé",
        leadValue: 53
      }
    });

  } catch (error) {
    console.error('❌ Erreur chat dual brain:', error);
    
    // CTA de fallback en cas d'erreur
    const fallbackCTA = {
      title: '🆘 Support Re-Fap Direct',
      message: 'Une erreur est survenue. Notre équipe Re-Fap est là pour vous aider !',
      buttons: [
        {
          text: '📧 support@re-fap.fr',
          url: CTA_CONFIG.refap.contact,
          type: 'primary'
        },
        {
          text: '📞 Appeler maintenant',
          url: CTA_CONFIG.refap.phone,
          type: 'secondary'
        }
      ]
    };

    return res.status(500).json({
      message: '❌ Erreur technique. Notre équipe support Re-Fap va vous aider rapidement.',
      cta: fallbackCTA,
      error: true
    });
  }
}
