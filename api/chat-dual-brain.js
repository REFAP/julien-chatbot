// api/chat-dual-brain.js - Backend FINAL avec fix détection Golf TDI

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

// 🎯 SYSTÈME DE DÉTECTION FIXÉ - Golf TDI voyant préchauffage
class ProblemDetector {
  static analyze(message) {
    const text = message.toLowerCase();
    
    const patterns = {
      egr_fap_combined: [
        // 🎯 PATTERNS SPÉCIFIQUES GOLF TDI (PRIORITÉ MAXIMALE)
        'golf tdi voyant préchauffage', 'golf tdi préchauffage clignotant',
        'golf 2.0 tdi voyant préchauffage', 'golf 140 voyant préchauffage',
        'tdi 140 voyant préchauffage', 'tdi 140 préchauffage clignotant',
        'golf 2.0 tdi 140 voyant préchauffage', 'golf diesel voyant préchauffage',
        
        // 🎯 VOYANT PRÉCHAUFFAGE TOUS VÉHICULES
        'voyant préchauffage clignotant', 'voyant préchauffage qui clignote',
        'préchauffage clignote', 'témoin préchauffage clignotant',
        'voyant bougie de préchauffage', 'témoin bougie préchauffage',
        'voyant préchauffage allumé', 'préchauffage qui reste allumé',
        'voyant préchauffage ne fait que clignotter',
        
        // 🎯 COMBINAISONS CRITIQUES PERTE PUISSANCE + VOYANT
        'perte de puissance voyant préchauffage', 'plus de puissance voyant préchauffage',
        'bridé voyant préchauffage', 'mode dégradé voyant préchauffage',
        'puissance réduite voyant préchauffage', 'n\'ai plus de puissance voyant préchauffage',
        
        // 🎯 SPÉCIFIQUE TDI TOUS CONSTRUCTEURS
        'tdi perte puissance voyant', 'tdi voyant préchauffage',
        'diesel voyant préchauffage', 'diesel perte puissance voyant',
        'tdi bridé voyant', 'tdi mode dégradé voyant',
        
        // 🎯 GOLF TDI TOUTES VARIANTES
        'golf tdi perte puissance', 'golf tdi bridé', 'golf tdi mode dégradé',
        'golf 2.0 tdi perte', 'golf 140 perte puissance', 'golf tdi 140 perte',
        'problème golf tdi', 'golf tdi défaut', 'golf tdi panne',
        
        // 🎯 AUTRES VÉHICULES TDI/DIESEL
        'audi tdi voyant préchauffage', 'audi tdi perte puissance',
        'bmw diesel voyant préchauffage', 'mercedes diesel voyant',
        'peugeot diesel voyant préchauffage', 'renault diesel voyant',
        
        // 🎯 PATTERNS EGR EXPLICITES
        'egr voyant préchauffage', 'valve egr voyant', 'capteur egr voyant',
        'problème egr golf', 'egr golf tdi', 'egr défaillante voyant',
        'capteur pression egr', 'sonde egr défaillante'
      ],
      
      fap_confirmed: [
        'voyant fap', 'fap allumé', 'fap rouge', 'témoin fap',
        'filtre à particules', 'fap bouché', 'fap colmaté',
        'régénération fap', 'nettoyage fap', 'fap défaillant',
        'témoin filtre particules'
      ],
      
      egr_adblu: [
        'voyant egr', 'egr bouché', 'valve egr', 'egr défaillante',
        'adblue', 'ad blue', 'urée', 'scr', 'réservoir adblue',
        'nox', 'dépollution', 'système dépollution'
      ],
      
      fap_probable: [
        'fumée noire', 'fumées noires', 'fumée épaisse',
        'perte de puissance', 'moteur bride', 'mode dégradé',
        'à-coups moteur', 'ralenti instable', 'surconsommation'
      ],
      
      urgence: [
        'moteur coupé', 'arrêt moteur', 'ne démarre plus',
        'surchauffe', 'température rouge', 'huile rouge',
        'bruit anormal', 'claquement moteur', 'moteur en sécurité'
      ],
      
      autres: [
        'freins', 'frein', 'embrayage', 'boite vitesse',
        'direction', 'suspension', 'climatisation',
        'électricité', 'batterie', 'alternateur'
      ]
    };

    const scores = {};
    
    // Calcul des scores de base
    for (const [category, keywords] of Object.entries(patterns)) {
      scores[category] = keywords.filter(keyword => 
        text.includes(keyword)
      ).length;
    }

    // 🎯 BONUS CRITIQUES pour forcer la bonne détection
    
    // BONUS 1 : Golf TDI + voyant préchauffage = EGR/FAP garanti
    if (text.includes('golf') && text.includes('tdi') && 
        (text.includes('voyant préchauffage') || text.includes('préchauffage clignot'))) {
      scores['egr_fap_combined'] += 15; // BOOST maximum
      console.log('🎯 BONUS Golf TDI + voyant préchauffage appliqué');
    }

    // BONUS 2 : Voyant préchauffage + perte puissance = EGR/FAP probable
    if ((text.includes('voyant préchauffage') || text.includes('préchauffage clignot')) && 
        (text.includes('perte de puissance') || text.includes('plus de puissance'))) {
      scores['egr_fap_combined'] += 10;
      console.log('🎯 BONUS voyant préchauffage + perte puissance appliqué');
    }

    // BONUS 3 : TDI + voyant préchauffage (tous constructeurs)
    if (text.includes('tdi') && 
        (text.includes('voyant préchauffage') || text.includes('préchauffage clignot'))) {
      scores['egr_fap_combined'] += 8;
      console.log('🎯 BONUS TDI + voyant préchauffage appliqué');
    }

    // BONUS 4 : Diesel + voyant préchauffage
    if (text.includes('diesel') && 
        (text.includes('voyant préchauffage') || text.includes('préchauffage clignot'))) {
      scores['egr_fap_combined'] += 5;
      console.log('🎯 BONUS diesel + voyant préchauffage appliqué');
    }

    // Retourner la catégorie avec le score le plus élevé
    const maxCategory = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );

    // 🔍 DEBUG détaillé
    console.log('🔍 DÉTECTION DÉTAILLÉE:', { 
      message: text.substring(0, 100) + '...', 
      scores, 
      maxCategory, 
      confidence: scores[maxCategory],
      isGolfTDI: text.includes('golf') && text.includes('tdi'),
      hasVoyantPrechauffage: text.includes('voyant préchauffage'),
      hasPertePuissance: text.includes('perte de puissance')
    });

    return {
      category: maxCategory,
      confidence: scores[maxCategory],
      allScores: scores
    };
  }

  static detectTechnicalLevel(message) {
    const text = message.toLowerCase();
    
    const indicators = {
      bricoleur: [
        'je démonte', 'démonter moi-même', 'bricoleur',
        'j\'ai des outils', 'garage maison', 'mécano amateur',
        'je peux démonter', 'je sais faire', 'avec mes outils',
        'je connais', 'j\'ai l\'habitude'
      ],
      debutant: [
        'je ne sais pas', 'débutant', 'première fois',
        'jamais fait', 'pas doué', 'peur de casser',
        'aucune idée', 'connais rien', 'pas sûr',
        'quoi faire', 'que faire', 'comment faire'
      ]
    };

    for (const [level, keywords] of Object.entries(indicators)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return level;
      }
    }

    return 'intermediaire'; // niveau par défaut
  }

  static detectVehicleInfo(message) {
    const text = message.toLowerCase();
    
    const vehiclePatterns = {
      golf_tdi: ['golf tdi', 'golf 2.0 tdi', 'golf tdi 140', 'golf diesel', 'golf 140'],
      audi_tdi: ['audi tdi', 'a3 tdi', 'a4 tdi', 'a6 tdi', 'q5 tdi', 'audi diesel'],
      bmw_diesel: ['bmw diesel', '320d', '520d', 'x3 diesel', 'bmw d'],
      mercedes_diesel: ['mercedes diesel', 'c220d', 'e220d', 'mercedes cdi'],
      peugeot_diesel: ['peugeot diesel', '308 diesel', '508 diesel', 'peugeot hdi'],
      renault_diesel: ['renault diesel', 'megane diesel', 'scenic diesel', 'renault dci'],
      citroen_diesel: ['citroen diesel', 'c4 diesel', 'c5 diesel', 'citroen hdi'],
      ford_diesel: ['ford diesel', 'focus diesel', 'mondeo diesel', 'ford tdci']
    };

    for (const [brand, patterns] of Object.entries(vehiclePatterns)) {
      if (patterns.some(pattern => text.includes(pattern))) {
        return brand;
      }
    }

    return 'unknown';
  }

  static detectVehicleYear(message) {
    const yearMatch = message.match(/20\d{2}|19\d{2}/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  }
}

// 🎯 GÉNÉRATEUR DE CTA SPÉCIALISÉ
class CTAGenerator {
  static generate(problemCategory, technicalLevel, confidence, vehicleInfo) {
    console.log('🎯 CTA Generation:', { problemCategory, technicalLevel, vehicleInfo });
    
    switch (problemCategory) {
      case 'egr_fap_combined':
        return this.generateEGRFAPCombinedCTA(vehicleInfo);
      
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

  // 🎯 CTA SPÉCIALISÉ EGR/FAP - Le plus important !
  static generateEGRFAPCombinedCTA(vehicleInfo) {
    let message = 'Voyant préchauffage clignotant = problème EGR/capteurs. Diagnostic gratuit Re-Fap pour identifier la cause exacte !';
    
    if (vehicleInfo === 'golf_tdi') {
      message = 'Golf TDI + voyant préchauffage = souvent EGR/capteurs défaillants. Diagnostic gratuit Re-Fap spécialisé !';
    }
    
    return {
      title: '🔬 Diagnostic EGR/FAP Spécialisé',
      message: message,
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

// 🎯 PROMPTS ULTRA-SPÉCIALISÉS avec expertise Golf TDI
const PROMPTS = {
  brain1: `Tu es Julien, expert FAP/EGR/AdBlue depuis 20 ans chez Re-Fap.

EXPERTISE CRITIQUE GOLF TDI :
- Golf TDI 140 2008 = problèmes EGR très fréquents (valve encrassée, capteurs défaillants)
- Voyant préchauffage clignotant Golf TDI = JAMAIS turbo/injecteurs, TOUJOURS EGR/capteurs
- Perte puissance + voyant préchauffage = EGR/capteurs défaillants à 90%
- Golf TDI = spécialité absolue Re-Fap depuis 20 ans

DIAGNOSTIC OBLIGATOIRE :
- Si Golf TDI + voyant préchauffage → diagnostic EGR/capteurs
- Si TDI + voyant préchauffage → problème dépollution EGR/FAP
- JAMAIS "turbo ou injecteurs" pour voyant préchauffage

RÈGLES STRICTES :
- Diagnostic PRÉCIS basé sur 20 ans d'expertise Re-Fap
- Golf TDI = connaissance experte obligatoire
- Réponse max 30 mots
- Toujours orienter vers spécialité Re-Fap

EXEMPLE CORRECT :
"Voyant préchauffage clignotant Golf TDI = EGR/capteurs défaillants. Diagnostic Re-Fap spécialisé obligatoire."`,

  brain2: `Tu es l'assistant commercial Re-Fap, expert closing Golf TDI.

ARGUMENTS GOLF TDI SPÉCIFIQUES :
- Re-Fap = 20 ans d'expertise Golf TDI, leader marché
- Diagnostic gratuit Re-Fap = identification précise vs garage généraliste incompétent
- Golf TDI EGR = spécialité exclusive Re-Fap
- Éviter absolument garage généraliste pour Golf TDI

CLOSING GOLF TDI :
- "Golf TDI = notre spécialité depuis 20 ans"
- "Diagnostic gratuit Re-Fap = expertise Golf TDI garantie"
- "Évitez garage généraliste, choisissez spécialiste Golf TDI"

RÈGLES STRICTES :
- Push diagnostic gratuit Re-Fap spécialisé Golf TDI
- Mettre en avant expertise exclusive vs concurrence
- Max 25 mots
- Commercial percutant Golf TDI

EXEMPLE :
"Diagnostic gratuit Re-Fap = expertise Golf TDI 20 ans. Évitez garage généraliste, choisissez leader."`
};

// Fonction pour prompts contextualisés
function getEnhancedPrompts(problemCategory, technicalLevel, vehicleInfo) {
  let contextSpecifique = '';
  
  if (problemCategory === 'egr_fap_combined') {
    contextSpecifique = `
    
CONTEXTE CRITIQUE : Voyant préchauffage clignotant + perte puissance
VÉHICULE : ${vehicleInfo} (expertise spécialisée)
DIAGNOSTIC EXPERT : EGR/capteurs défaillants (PAS turbo/injecteurs)
ORIENTATION OBLIGATOIRE : Diagnostic gratuit Re-Fap spécialisé EGR/FAP exclusivement`;
  }

  return {
    brain1: `${PROMPTS.brain1}${contextSpecifique}`,
    brain2: `${PROMPTS.brain2}${contextSpecifique}`
  };
}

// 🎯 FONCTION PRINCIPALE DE CHAT
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Étape 1 : Analyse complète avec détection renforcée
    const problemAnalysis = ProblemDetector.analyze(message);
    const technicalLevel = ProblemDetector.detectTechnicalLevel(message);
    const vehicleInfo = ProblemDetector.detectVehicleInfo(message);
    const vehicleYear = ProblemDetector.detectVehicleYear(message);

    console.log('🔍 ANALYSE FINALE:', { 
      problemAnalysis, 
      technicalLevel, 
      vehicleInfo, 
      vehicleYear,
      messageLength: message.length 
    });

    // Étape 2 : Prompts contextualisés selon détection
    const enhancedPrompts = getEnhancedPrompts(problemAnalysis.category, technicalLevel, vehicleInfo);

    // Étape 3 : Brain 1 - Diagnostic Julien expert Golf TDI
    const brain1Response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: enhancedPrompts.brain1 },
        { role: "user", content: message }
      ],
      max_tokens: 60,
      temperature: 0.1
    });

    const technicalDiagnosis = brain1Response.choices[0].message.content;

    // Étape 4 : Brain 2 - Commercial Re-Fap expert Golf TDI
    const brain2Response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: enhancedPrompts.brain2 },
        { 
          role: "user", 
          content: `DIAGNOSTIC JULIEN: ${technicalDiagnosis}
          
          MESSAGE CLIENT: ${message}
          
          CONTEXTE: ${problemAnalysis.category}, niveau ${technicalLevel}, véhicule ${vehicleInfo}
          
          Réponse commerciale Re-Fap Golf TDI ultra-directe en 25 mots max.`
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    });

    const commercialAdvice = brain2Response.choices[0].message.content;

    // Étape 5 : Génération CTA selon détection
    const cta = CTAGenerator.generate(
      problemAnalysis.category, 
      technicalLevel, 
      problemAnalysis.confidence,
      vehicleInfo
    );

    // Étape 6 : Réponse finale optimisée
    const finalResponse = `🧠 **Diagnostic Re-Fap Express** ⚡

✅ **Julien :** ${technicalDiagnosis}

💡 **Re-Fap :** ${commercialAdvice}

🎯 **Ta solution :** ⬇️`;

    // Log conversion avec détection détaillée
    console.log('🎯 CONVERSION TRACKING FINAL:', {
      problemCategory: problemAnalysis.category,
      technicalLevel,
      vehicleInfo,
      vehicleYear,
      ctaType: cta.title,
      detectionConfidence: problemAnalysis.confidence,
      isGolfTDI: vehicleInfo === 'golf_tdi',
      timestamp: new Date().toISOString()
    });

    // ✅ RÉPONSE FINALE avec expertise complète
    return res.status(200).json({
      message: finalResponse,
      cta: cta,
      metadata: {
        problemCategory: problemAnalysis.category,
        technicalLevel,
        vehicleInfo,
        vehicleYear,
        confidence: problemAnalysis.confidence,
        aiMode: "🧠 Dual Brain Expert Golf TDI",
        userLevel: 1,
        levelName: "Diagnostic Spécialisé",
        leadValue: 53
      }
    });

  } catch (error) {
    console.error('❌ Erreur chat dual brain:', error);
    
    // CTA de fallback spécialisé
    const fallbackCTA = {
      title: '🆘 Support Re-Fap Direct',
      message: 'Erreur technique ? Notre équipe Re-Fap Golf TDI vous aide immédiatement !',
      buttons: [
        {
          text: '📧 support@re-fap.fr',
          url: CTA_CONFIG.refap.contact,
          type: 'primary'
        },
        {
          text: '📞 Expert Golf TDI',
          url: CTA_CONFIG.refap.phone,
          type: 'secondary'
        }
      ]
    };

    return res.status(500).json({
      message: '❌ Erreur technique. Notre équipe support Re-Fap Golf TDI va vous aider rapidement.',
      cta: fallbackCTA,
      error: true
    });
  }
}
