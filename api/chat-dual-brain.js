// api/chat-dual-brain.js - NOUVEAU Backend avec CTA intelligents Re-Fap

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

// Système de détection intelligent des problèmes
class ProblemDetector {
  static analyze(message) {
    const text = message.toLowerCase();
    
    const patterns = {
      fap_confirmed: [
        'voyant fap', 'fap allumé', 'fap rouge', 'témoin fap',
        'filtre à particules', 'fap bouché', 'fap colmaté',
        'régénération fap', 'nettoyage fap'
      ],
      fap_probable: [
        'fumée noire', 'fumées noires', 'fumée épaisse',
        'perte de puissance', 'moteur bride', 'mode dégradé',
        'à-coups moteur', 'ralenti instable'
      ],
      egr_adblu: [
        'voyant egr', 'egr bouché', 'valve egr',
        'adblue', 'ad blue', 'urée', 'scr',
        'nox', 'dépollution'
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

  static detectTechnicalLevel(message) {
    const text = message.toLowerCase();
    
    const indicators = {
      bricoleur: [
        'je démonte', 'démonter moi-même', 'bricoleur',
        'j\'ai des outils', 'garage maison', 'mécano amateur',
        'je peux démonter', 'je sais faire'
      ],
      debutant: [
        'je ne sais pas', 'débutant', 'première fois',
        'jamais fait', 'pas doué', 'peur de casser',
        'aucune idée', 'connais rien'
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

// Prompts pour les deux cerveaux
const PROMPTS = {
  brain1: `Tu es Julien, expert en diagnostic automobile depuis 20 ans, spécialisé dans les systèmes FAP, EGR et AdBlue chez Re-Fap.

RÈGLES STRICTES :
- Réponds UNIQUEMENT aux problèmes automobiles
- Spécialise-toi en FAP/EGR/AdBlue mais aide aussi pour autres pannes
- Sois précis, technique mais accessible
- Propose des solutions concrètes Re-Fap
- Reste professionnel et rassurant
- Utilise ton expérience de 20 ans

Si problème hors automobile : "Je suis Julien, spécialisé en diagnostic auto Re-Fap. Peux-tu me décrire ton problème de véhicule ?"`,

  brain2: `Tu es l'assistant commercial Re-Fap, expert en orientation client vers les solutions Re-Fap.

MISSION :
- Analyser le diagnostic technique de Julien
- Orienter intelligemment vers les solutions Re-Fap
- Adapter le niveau de conseil au profil client  
- Rassurer et guider vers l'action Re-Fap
- Mettre en avant les avantages Re-Fap

SOLUTIONS RE-FAP :
- Carter-Cash pour bricoleurs
- Envoi direct Re-Fap  
- Garages partenaires Re-Fap
- Diagnostic gratuit Re-Fap

TONALITÉ :
- Amical et professionnel
- Orienté solution Re-Fap
- Confiant en Re-Fap
- Pédagogue`
};

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

    // Étape 2 : Brain 1 - Diagnostic technique Julien
    const brain1Response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: PROMPTS.brain1 },
        { role: "user", content: message }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    const technicalDiagnosis = brain1Response.choices[0].message.content;

    // Étape 3 : Brain 2 - Conseil commercial Re-Fap
    const brain2Response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: PROMPTS.brain2 },
        { 
          role: "user", 
          content: `DIAGNOSTIC JULIEN: ${technicalDiagnosis}
          
          MESSAGE CLIENT: ${message}
          
          CONTEXTE:
          - Problème détecté: ${problemAnalysis.category}
          - Niveau technique: ${technicalLevel}
          - Confiance: ${problemAnalysis.confidence}/5
          
          Donne une réponse commerciale orientée Re-Fap basée sur ce diagnostic.`
        }
      ],
      max_tokens: 250,
      temperature: 0.7
    });

    const commercialAdvice = brain2Response.choices[0].message.content;

    // Étape 4 : Génération du CTA approprié
    const cta = CTAGenerator.generate(
      problemAnalysis.category, 
      technicalLevel, 
      problemAnalysis.confidence
    );

    // Étape 5 : Fusion des réponses
    const finalResponse = `🧠 **Analyse Dual Brain Premium** 🔧

**Diagnostic Expert (Julien):**
${technicalDiagnosis}

**Analyse Complémentaire (OpenAI):**
${commercialAdvice}

✅ **Diagnostic complet terminé !**`;

    // Log pour analytics
    console.log('🎯 Conversion tracking:', {
      problemCategory: problemAnalysis.category,
      technicalLevel,
      ctaType: cta.title,
      timestamp: new Date().toISOString()
    });

    // ✅ NOUVEAU FORMAT avec CTA
    return res.status(200).json({
      message: finalResponse,
      cta: cta,
      metadata: {
        problemCategory: problemAnalysis.category,
        technicalLevel,
        confidence: problemAnalysis.confidence,
        aiMode: "🧠 Dual Brain (Claude + OpenAI)",
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
      message: 'Désolé, une erreur est survenue. Notre équipe support Re-Fap va vous aider à résoudre votre problème automobile.',
      cta: fallbackCTA,
      error: true
    });
  }
}
