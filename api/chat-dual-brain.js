// api/chat-dual-brain.js
// Système complet avec Intelligence Simulée (fini les réponses pourries !)

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, userData = {}, sessionId, action } = req.body;

        // Si c'est une action Airtable, gérer séparément
        if (action) {
            return handleAirtableAction(req, res);
        }

        if (!message) {
            return res.status(400).json({ error: 'Message requis' });
        }

        console.log('🧠 Dual Brain Intelligence démarré:', { message, userData, sessionId });

        // 1. ANALYSE UTILISATEUR ET QUESTION
        const analysis = analyzeUserAndQuestion(message, userData);
        console.log('📊 Analyse:', analysis);

        // 2. APPEL SYSTÈME INTELLIGENT (toujours simulé pour éviter les réponses pourries)
        const aiResponse = await callIntelligentSystem(message, analysis);
        console.log('🤖 Réponse IA:', aiResponse.mode);

        // 3. CIRCUIT DE RÉCOMPENSE
        const rewardStrategy = generateRewardStrategy(analysis.userLevel, analysis.questionType);

        // 4. GÉNÉRATION LEAD SI APPLICABLE
        let leadInfo = null;
        if (analysis.userLevel > 0 && analysis.leadValue > 0) {
            leadInfo = {
                leadId: `lead_${Date.now()}`,
                value: analysis.leadValue,
                partner: analysis.partner,
                status: 'generated'
            };
        }

        // 5. RÉPONSE FINALE
        return res.status(200).json({
            success: true,
            message: aiResponse.text,
            strategy: aiResponse.strategy,
            aiMood: aiResponse.mood,
            score: aiResponse.score,
            timestamp: new Date().toISOString(),
            isPremium: analysis.userLevel > 0,

            // Système de récompense
            rewardSystem: {
                userLevel: analysis.userLevel,
                levelName: analysis.levelName,
                conversionStrategy: rewardStrategy,
                leadValue: analysis.leadValue,
                partner: analysis.partner
            },

            // Informations business
            leadInfo,
            
            // Métadonnées
            metadata: {
                questionType: analysis.questionType,
                aiMode: aiResponse.mode,
                processingTime: aiResponse.processingTime,
                sessionId
            }
        });

    } catch (error) {
        console.error('💥 Erreur Dual Brain:', error);
        
        return res.status(200).json({
            success: true,
            message: "Je rencontre un problème technique temporaire. Peux-tu reformuler ta question ? 🔧",
            strategy: "error_fallback",
            score: 5.0,
            timestamp: new Date().toISOString(),
            error: "Fallback mode activé"
        });
    }
}

// ANALYSE UTILISATEUR ET QUESTION
function analyzeUserAndQuestion(message, userData) {
    // Niveau utilisateur
    let userLevel = 0;
    if (userData.email) userLevel = 1;
    if (userData.phone) userLevel = 2;
    if (userData.vehicleModel && userData.location) userLevel = 3;

    // Type de question
    const questionType = detectQuestionType(message);
    
    // Urgence
    const urgency = detectUrgency(message);
    
    // Valeur lead
    const leadValue = calculateLeadValue(userLevel, questionType, urgency);
    
    // Partenaire optimal
    const partner = getOptimalPartner(questionType, leadValue);

    return {
        userLevel,
        levelName: getLevelName(userLevel),
        questionType,
        urgency,
        leadValue,
        partner,
        canUpgrade: userLevel < 3
    };
}

// SYSTÈME INTELLIGENT (Toujours simulé intelligemment)
async function callIntelligentSystem(message, analysis) {
    const startTime = Date.now();

    console.log('🧠 Mode Intelligence Simulée Avancée activé');
    return generateIntelligentSimulation(message, analysis, startTime);
}

// 🧠 INTELLIGENCE SIMULÉE AVANCÉE (remplace les réponses pourries)
function generateIntelligentSimulation(message, analysis, startTime) {
    const messageLower = message.toLowerCase();
    let response = "";
    let mood = "expert_analysis";
    let score = 8.5;

    // Détection intelligente du problème selon niveau utilisateur
    if (messageLower.includes('voyant moteur') || (messageLower.includes('voyant') && messageLower.includes('moteur'))) {
        
        if (analysis.userLevel === 0) {
            response = `**Voyant moteur détecté - Analyse Julien** 🔧

Ah ! Un voyant moteur... D'après mon expérience de 20 ans, ça peut indiquer plusieurs choses selon la couleur et le comportement.

🔍 **Mes questions d'expert :**
- Quelle couleur exactement ? (Orange, rouge, jaune ?)
- Il clignote ou reste fixe ?
- Depuis quand tu l'as remarqué ?
- As-tu noté d'autres symptômes ? (perte puissance, fumée, bruits...)

💡 **Première analyse :**
Si c'est orange et qu'il clignote, c'est souvent lié au système anti-pollution (FAP/EGR). Si c'est rouge fixe, c'est plus urgent !

🔓 **Pour un diagnostic complet avec estimation précise des coûts, laisse ton email !**`;
        } else {
            response = `**Diagnostic moteur approfondi** 🎯

Voyant moteur détecté ! Avec ton profil, je peux aller plus loin dans l'analyse.

🔍 **Analyse technique avancée :**
Selon la couleur et le comportement du voyant, voici les causes probables :
- Orange clignotant : FAP/EGR encrassé (80% des cas)
- Orange fixe : Capteur défaillant ou injection
- Rouge : Problème grave moteur (arrêt immédiat recommandé)

💡 **Mon diagnostic personnalisé :**
Avec tes symptômes et le modèle de véhicule, je peux estimer que c'est probablement un problème de ${analysis.questionType}. 

📊 **Estimation coûts :**
- Nettoyage FAP : 150-250€
- Remplacement capteur : 80-200€
- Intervention complète : 300-500€

🎯 **Recommandation experte :** Diagnostic complet recommandé pour éviter une panne plus grave.`;
            mood = "expert_premium";
            score = 9.2;
        }

    } else if (messageLower.includes('fap') || messageLower.includes('egr') || messageLower.includes('adblue')) {
        
        if (analysis.userLevel === 0) {
            response = `**Problème FAP/EGR détecté** 🔧

Alors ! FAP ou EGR qui pose problème... C'est exactement mon domaine d'expertise !

🎯 **Questions de diagnostic précis :**
- Tu fais plutôt ville ou autoroute ?
- Depuis quand le voyant ?
- Ça fume ? Quelle couleur de fumée ?
- Perte de puissance ressentie ?
- Marque/modèle de ta voiture ?

💡 **Mon expertise Re-Fap :**
Dans 80% des cas, c'est un encrassement qui se résout par un bon nettoyage professionnel. Mais il faut d'abord identifier la cause exacte pour éviter la récidive !

🔓 **Diagnostic premium disponible - laisse ton email pour une analyse détaillée !**`;
        } else {
            response = `**Expertise FAP/EGR Premium** 🏆

Problème FAP/EGR confirmé ! Avec ton niveau premium, voici mon analyse experte complète :

🔍 **Diagnostic approfondi :**
Le système FAP/EGR travaille ensemble pour réduire les émissions. Quand l'un dysfonctionne, ça impact l'autre.

📊 **Causes principales :**
1. Conduite urbaine excessive (70% des cas)
2. Encrassement progressif du FAP
3. Vanne EGR bloquée
4. Capteurs de pression défaillants

💰 **Solutions et coûts :**
- Nettoyage complet Re-Fap : 180€ (vs 1200€ de remplacement)
- Nettoyage EGR : 120€
- Pack complet : 250€ (économie 900€)

🎯 **Ma recommandation :** Nettoyage préventif tous les 40 000km pour éviter la panne !`;
            mood = "expert_premium";
            score = 9.5;
        }

    } else if (messageLower.includes('fume') || messageLower.includes('fumée')) {
        
        response = `**Problème de fumée - Diagnostic prioritaire** 💨

Ça fume ! C'est un symptôme important à analyser rapidement.

🔍 **Couleur de la fumée cruciale :**
- **Blanche** = Souvent FAP en régénération (normal)
- **Noire** = Problème injection/mélange air-carburant
- **Bleue** = Consommation d'huile moteur

📋 **Questions techniques :**
- Ça fume au démarrage ou en roulant ?
- Depuis quand exactement ?
- Ça sent fort ? Quelle odeur ?
- Marque/modèle/année de ta voiture ?

⚡ **Mon conseil immédiat :**
Si c'est noir et que ça sent très fort, évite les longs trajets en attendant le diagnostic !

${analysis.userLevel === 0 ? 
    '🔓 **Pour un diagnostic complet, laisse ton email !**' : 
    '🎯 **Diagnostic précis possible avec tes infos - estimation coûts incluse !**'}`;

    } else if (messageLower.includes('puissance') || messageLower.includes('accélér') || messageLower.includes('reprise')) {
        
        response = `**Perte de puissance analysée** ⚡

Plus de pêche au démarrage ? C'est frustrant et ça peut cacher plusieurs problèmes !

🎯 **Diagnostic puissance :**
- **À froid** = Bougies de préchauffage ou injection
- **À chaud** = FAP bouché ou turbo fatigué
- **En ville** = Souvent encrassement FAP
- **Autoroute** = Plutôt turbo ou injection

💡 **Causes fréquentes :**
1. FAP encrassé (60% des cas)
2. Capteurs encrassés (débitmètre d'air)
3. Problème turbo (perte pression)
4. Injection à nettoyer

${analysis.userLevel === 0 ?
    '🔓 **Diagnostic complet contre ton email - avec solutions précises !**' :
    '📊 **Estimation : 150-400€ selon la cause. Diagnostic approfondi disponible !**'}`;

    } else if (messageLower.includes('démarr') || messageLower.includes('demarre') || messageLower.includes('démarre')) {
        
        response = `**Problème de démarrage - Diagnostic urgent** 🔋

Ça ne démarre plus ? Situation embêtante ! Analysons ça méthodiquement.

🔍 **Questions de diagnostic :**
- Le moteur tourne mais ne prend pas ?
- Ou ça ne tourne même pas du tout ?
- Tu entends le bruit du démarreur ?
- Voyants qui s'allument normalement ?
- Dernière utilisation quand ?

⚡ **Causes principales :**
1. **Batterie faible** (40% des pannes)
2. **Bougies de préchauffage** (diesel)
3. **Problème carburant** (réservoir vide, pompe)
4. **Capteurs** (température, position vilebrequin)

🚨 **Conseil immédiat :** Si ça ne tourne pas = souvent batterie. Si ça tourne sans prendre = carburant/allumage.

${analysis.userLevel === 0 ? 
    '🔓 **Diagnostic précis disponible - laisse ton email !**' : 
    '🎯 **Solutions détaillées avec estimation coûts disponibles !**'}`;

    } else if (messageLower.includes('bruit')) {
        
        response = `**Analyse de bruit - Diagnostic audio** 🔊

Un bruit suspect ? Mon oreille d'expert de 20 ans va t'aider !

🎯 **Identification sonore :**
- **Sifflement** = Souvent turbo ou admission d'air
- **Claquement** = Possiblement moteur (soupapes, pistons)
- **Grincement** = Freins ou courroies
- **Ronflement** = Échappement ou roulements

📋 **Précisions nécessaires :**
- Quand exactement ? (démarrage, accélération, freinage...)
- D'où ça vient ? (moteur, roues, dessous...)
- Depuis combien de temps ?
- Ça s'aggrave ou c'est constant ?

💡 **Mon expérience :** Chaque bruit a sa signature ! Avec une bonne description, je peux souvent identifier la cause.

${analysis.userLevel === 0 ?
    '🔓 **Diagnostic audio complet disponible - ton email suffit !**' :
    '🎯 **Analyse premium avec solutions immédiates !**'}`;

    } else {
        // Réponse générale intelligente
        response = `**Diagnostic automobile personnalisé** 🔧

Salut ! Julien ici, expert automobile depuis 20 ans chez Re-Fap.

🎯 **Pour un diagnostic précis, j'ai besoin de quelques infos :**
- Marque et modèle de ta voiture ?
- Année approximative ?
- Symptômes exacts que tu observes ?
- Depuis quand ça a commencé ?
- Kilométrage actuel ?

💡 **Mon approche d'expert :**
Je préfère poser les bonnes questions plutôt que de deviner ! Chaque voiture a ses spécificités, et avec 20 ans d'expérience, je peux te donner un diagnostic fiable.

🎯 **Mes spécialités :**
- FAP/EGR/AdBlue (ma spécialité)
- Problèmes moteur et injection
- Diagnostic électronique
- Solutions économiques vs remplacement

${analysis.userLevel === 0 ?
    '🔓 **Pour un diagnostic approfondi, laisse-moi ton email !**' :
    '🏆 **Analyse premium activée - diagnostic complet disponible !**'}`;
    }

    return {
        text: response,
        strategy: "intelligent_simulation",
        mood: mood,
        score: score,
        mode: "intelligent_simulation",
        processingTime: Date.now() - startTime
    };
}

// GESTION ACTIONS AIRTABLE
async function handleAirtableAction(req, res) {
    const { action, data } = req.body;
    
    // Actions Airtable simplifiées
    if (action === 'CREATE_LEAD') {
        console.log('📝 Lead simulation:', data);
        return res.status(200).json({
            success: true,
            leadId: `sim_${Date.now()}`,
            message: 'Lead simulé créé'
        });
    }
    
    if (action === 'CREATE_DIAGNOSTIC') {
        console.log('🔧 Diagnostic simulation:', data);
        return res.status(200).json({
            success: true,
            diagnosticId: `diag_${Date.now()}`,
            message: 'Diagnostic simulé'
        });
    }
    
    return res.status(200).json({
        success: true,
        message: 'Action simulée'
    });
}

// UTILITAIRES
function detectQuestionType(message) {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('frein') || messageLower.includes('freinage')) return 'brakes';
    if (messageLower.includes('moteur') || messageLower.includes('voyant')) return 'engine';
    if (messageLower.includes('fap') || messageLower.includes('egr')) return 'engine';
    if (messageLower.includes('démarr') || messageLower.includes('batterie')) return 'electrical';
    if (messageLower.includes('boite') || messageLower.includes('vitesse')) return 'transmission';
    
    return 'general';
}

function detectUrgency(message) {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('urgent') || messageLower.includes('panne') || messageLower.includes('ne démarre plus')) return 'high';
    if (messageLower.includes('bientôt') || messageLower.includes('prévoir')) return 'medium';
    
    return 'low';
}

function calculateLeadValue(userLevel, questionType, urgency) {
    const baseValues = {
        'engine': 40,
        'brakes': 35, 
        'transmission': 45,
        'electrical': 30,
        'general': 25
    };

    const urgencyMultiplier = {
        'high': 1.5,
        'medium': 1.2,
        'low': 1.0
    };

    const levelMultiplier = [0, 1, 1.8, 2.5][userLevel] || 1;

    return Math.round(
        (baseValues[questionType] || 25) * 
        urgencyMultiplier[urgency] * 
        levelMultiplier
    );
}

function getOptimalPartner(questionType, leadValue) {
    if (questionType === 'engine' && leadValue >= 40) return 'IDGARAGES';
    if (questionType === 'brakes') return 'MIDAS';
    return 'Re-Fap';
}

function getLevelName(userLevel) {
    const names = {
        0: 'Diagnostic de Base',
        1: 'Diagnostic Avancé', 
        2: 'Expertise Premium',
        3: 'Service VIP'
    };
    return names[userLevel] || 'Inconnu';
}

function generateRewardStrategy(userLevel, questionType) {
    if (userLevel === 0) {
        return {
            trigger: `🔓 **Diagnostic ${questionType === 'engine' ? 'moteur' : questionType === 'brakes' ? 'freinage' : 'automobile'} complet disponible !**\n\nPour une analyse approfondie avec estimation précise des coûts, laissez simplement votre email.`,
            required: ['email', 'firstName', 'location'],
            reward: 'diagnostic premium avec estimation coûts'
        };
    } else if (userLevel === 1) {
        return {
            trigger: `📞 **Expert disponible pour vous rappeler !**\n\nUn de nos partenaires peut vous rappeler dans l'heure pour un devis personnalisé.`,
            required: ['phone', 'vehicleModel'],
            reward: 'rappel expert personnalisé'
        };
    }
    
    return null;
}
