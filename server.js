const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configuration des APIs
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// ==================== BASE EXPERTE FAP RE-FAP ====================
const FAP_EXPERT_DATABASE = [
  {
    id: 'FAP_VOYANT_PUISSANCE',
    keywords: ['voyant', 'moteur', 'puissance', 'perte'],
    title: 'Voyant moteur + perte de puissance',
    diagnosis: `🔧 **Diagnostic FAP Re-Fap Expert**

**Problème identifié :** Voyant moteur allumé avec perte de puissance

**Cause la plus probable (85%) :** FAP (Filtre à Particules) colmaté

**Pourquoi ça arrive :**
• Conduite urbaine trop fréquente (trajets < 20 min)
• FAP qui ne peut pas se régénérer (besoin de 600°C pendant 20+ min)
• Accumulation progressive de suie

**Solutions par ordre de priorité :**

1️⃣ **Test immédiat :** Trajet autoroute 30+ km à 90+ km/h
2️⃣ **Si échec :** Nettoyage FAP Re-Fap professionnel  
3️⃣ **Si récurrent :** Changement habitudes de conduite`,
    confidence: 0.85,
    ctas: [
      {
        type: 'self_service',
        title: '🛣️ Guide régénération autoroute',
        description: 'Protocole à essayer en premier',
        action: 'highway_regen'
      },
      {
        type: 'professional', 
        title: '🔧 Nettoyage FAP Re-Fap',
        description: 'Solution professionnelle garantie',
        action: 'book_cleaning'
      }
    ]
  },
  
  {
    id: 'FAP_FUMEE_NOIRE',
    keywords: ['fumée', 'noire', 'echappement', 'acceleration'],
    title: 'Fumée noire à l\'échappement',
    diagnosis: `🔧 **Fumée noire = FAP colmaté**

**Explication technique :**
La fumée noire indique une combustion incomplète. Quand le FAP est colmaté, la contre-pression empêche l'évacuation normale des gaz.

**Gravité :** Modérée à élevée selon la fréquence

**Action recommandée :**
Nettoyage FAP professionnel dans les plus brefs délais`,
    confidence: 0.90,
    ctas: [
      {
        type: 'professional',
        title: '🔧 Nettoyage FAP urgent',
        description: 'Intervention recommandée sous 48h',
        action: 'urgent_cleaning'
      }
    ]
  },

  {
    id: 'FAP_CODE_P2002',
    keywords: ['P2002', 'p2002', 'code', 'erreur'],
    title: 'Code erreur P2002',
    diagnosis: `🚨 **Code P2002 - Efficacité FAP insuffisante**

**Signification :** Votre FAP ne filtre plus assez efficacement les particules

**Causes possibles :**
• FAP saturé en suie (80% des cas)
• Capteur pression différentielle HS (15% des cas)  
• Fuites échappement (5% des cas)

**Action immédiate requise :** Diagnostic professionnel`,
    confidence: 0.95,
    ctas: [
      {
        type: 'emergency',
        title: '🚨 Diagnostic urgent',
        description: 'Code critique - intervention rapide',
        action: 'emergency_diagnostic'
      }
    ]
  },

  {
    id: 'FAP_CODE_P2463', 
    keywords: ['P2463', 'p2463'],
    title: 'Code erreur P2463',
    diagnosis: `🚨 **Code P2463 - CRITIQUE**

**Signification :** Accumulation excessive de suie dans le FAP

**ATTENTION :** Risque de dommages moteur si non traité

**Action URGENTE :** Arrêtez de rouler et contactez un professionnel`,
    confidence: 0.98,
    ctas: [
      {
        type: 'emergency',
        title: '🚨 Intervention immédiate',  
        description: 'URGENT - Risque panne complète',
        action: 'emergency_call'
      }
    ]
  },

  {
    id: 'FAP_CONDUITE_URBAINE',
    keywords: ['urbain', 'ville', 'court', 'trajet', 'regeneration'],
    title: 'Problème conduite urbaine',
    diagnosis: `🔍 **Conduite urbaine = Ennemi du FAP**

**Le problème :**
En ville, votre moteur ne chauffe JAMAIS assez longtemps pour permettre la régénération du FAP (600°C pendant 20+ minutes minimum).

**Comparaison :** C'est comme essayer de nettoyer un four sale en ne l'allumant que 5 minutes !

**Solutions :**
1. **Immédiat :** 1 trajet autoroute/semaine minimum (30+ km)
2. **Préventif :** Additif FAP Re-Fap mensuel
3. **Curatif :** Nettoyage professionnel si trop tard`,
    confidence: 0.80,
    ctas: [
      {
        type: 'education',
        title: '📚 Guide conduite FAP',
        description: 'Apprenez à préserver votre FAP',
        action: 'driving_guide'
      },
      {
        type: 'product',
        title: '🧴 Additif FAP Re-Fap',
        description: 'Solution préventive mensuelle',
        action: 'shop_additive'
      }
    ]
  }
];

// Autres problèmes non-FAP
const OTHER_EXPERT_DATABASE = [
  {
    id: 'TURBO_SIFFLE',
    keywords: ['turbo', 'siffle', 'sifflement', 'suralimentation'],
    diagnosis: `🔧 **Turbo qui siffle**

**Causes probables :**
• Turbine en début de jeu (60%)
• Durites d'air percées (30%)
• Roulements turbo usés (10%)

**Action :** Contrôle pression + inspection visuelle`,
    confidence: 0.75,
    ctas: [
      { type: 'diagnostic', title: '🔍 Diagnostic turbo', action: 'turbo_check' }
    ]
  },
  
  {
    id: 'EGR_PROBLEME',
    keywords: ['egr', 'vanne', 'prechauffage', 'clignote'],
    diagnosis: `🔧 **Problème EGR/Préchauffage**

**Symptôme :** Voyant préchauffage qui clignote
**Cause probable :** Vanne EGR encrassée ou capteur HS
**Solution :** Nettoyage vanne EGR + contrôle capteurs`,
    confidence: 0.80,
    ctas: [
      { type: 'service', title: '🔧 Service EGR', action: 'egr_service' }
    ]
  }
];

// ==================== MOTEUR EXPERT SIMPLE ====================
class FAPReExpert {
  constructor() {
    this.fapDB = FAP_EXPERT_DATABASE;
    this.otherDB = OTHER_EXPERT_DATABASE;
  }

  analyzeMessage(message) {
    const messageLower = message.toLowerCase();
    console.log(`🔍 Analyse: "${message}"`);

    // Recherche dans base FAP (priorité)
    for (const expert of this.fapDB) {
      const matchCount = expert.keywords.filter(keyword => 
        messageLower.includes(keyword)
      ).length;

      if (matchCount >= 1) {
        console.log(`✅ FAP Expert trouvé: ${expert.id} (${matchCount} matches)`);
        return {
          response: expert.diagnosis,
          source: 'fap_expert',
          confidence: expert.confidence,
          ctas: expert.ctas || [],
          title: expert.title
        };
      }
    }

    // Recherche autres problèmes
    for (const other of this.otherDB) {
      const hasMatch = other.keywords.some(keyword => 
        messageLower.includes(keyword)
      );

      if (hasMatch) {
        console.log(`✅ Autre expert: ${other.id}`);
        return {
          response: other.diagnosis,
          source: 'expert_database', 
          confidence: other.confidence,
          ctas: other.ctas || []
        };
      }
    }

    // Pas de match -> Suggestion questions
    return this.suggestQuestions();
  }

  suggestQuestions() {
    return {
      response: `Pour mieux vous aider, décrivez-moi :

• **Voyants allumés ?** (moteur, FAP, AdBlue...)
• **Perte de puissance ?** (à l'accélération, en côte...)  
• **Fumée ?** (noire, blanche, bleue...)
• **Codes d'erreur ?** (P2002, P2463...)
• **Type de conduite ?** (ville, autoroute...)

**💡 Astuce :** Plus vous êtes précis, plus mon diagnostic sera exact !`,
      source: 'fap_expert',
      confidence: 0.6,
      ctas: [
        {
          type: 'contact',
          title: '📞 Parler à un expert',
          action: 'contact_expert'
        }
      ]
    };
  }

  async getFallbackResponse(message) {
    if (!CLAUDE_API_KEY) {
      return "Je ne trouve pas de correspondance dans ma base d'expertise FAP. Pouvez-vous être plus précis sur vos symptômes ?";
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Tu es Julien, expert FAP Re-Fap. Question automobile: ${message}. Réponds brièvement et professionnellement.`
          }]
        })
      });

      const data = await response.json();
      return data.content?.[0]?.text || "Erreur de connexion à l'IA.";
    } catch (error) {
      console.error('❌ Erreur Claude:', error);
      return "Je ne peux pas analyser ce problème pour le moment. Contactez notre équipe pour une analyse personnalisée.";
    }
  }
}

// ==================== ROUTES ULTRA-SIMPLES ====================
const expert = new FAPReExpert();

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    console.log(`💬 Message reçu: "${message}"`);

    // Analyse directe
    const result = expert.analyzeMessage(message);
    
    // Si pas de match expert, utiliser fallback IA
    if (result.confidence < 0.7 && result.source === 'fap_expert' && !result.title) {
      console.log('🤖 Fallback IA...');
      const aiResponse = await expert.getFallbackResponse(message);
      
      return res.json({
        success: true,
        response: aiResponse,
        source: 'AI',
        confidence: 0.6,
        ctas: [
          {
            type: 'contact',
            title: '📞 Contacter un expert',
            action: 'contact_expert'
          }
        ],
        timestamp: new Date().toISOString()
      });
    }

    // Réponse experte
    res.json({
      success: true,
      response: result.response,
      source: result.source,
      confidence: result.confidence,
      ctas: result.ctas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      success: false
    });
  }
});

// Test direct
app.get('/api/test/:query', (req, res) => {
  try {
    const result = expert.analyzeMessage(req.params.query);
    res.json({
      query: req.params.query,
      result: result,
      debug: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      fap_expert: `${FAP_EXPERT_DATABASE.length} cas FAP`,
      other_expert: `${OTHER_EXPERT_DATABASE.length} autres cas`,
      claude_ai: CLAUDE_API_KEY ? 'Configuré' : 'Manquant'
    },
    version: 'FAP Re-Fap Expert - Version Finale'
  });
});

// Interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 FAP Re-Fap Expert FINAL démarré sur le port ${port}`);
  console.log(`🔧 ${FAP_EXPERT_DATABASE.length} diagnostics FAP intégrés`);
  console.log(`⚡ ${OTHER_EXPERT_DATABASE.length} autres problèmes couverts`);
  console.log(`🤖 Claude fallback: ${CLAUDE_API_KEY ? '✅' : '❌'}`);
  console.log(`✅ CETTE VERSION VA MARCHER !`);
});
