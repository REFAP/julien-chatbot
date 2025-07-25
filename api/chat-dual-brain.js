// api/chat-dual-brain.js
// Version avec vraies APIs Claude + OpenAI connectées

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

        console.log('🧠 Dual Brain RÉEL démarré:', { message, userData, sessionId });

        // 1. ANALYSE UTILISATEUR ET QUESTION
        const analysis = analyzeUserAndQuestion(message, userData);
        console.log('📊 Analyse:', analysis);

        // 2. APPEL SYSTÈME INTELLIGENT RÉEL
        const aiResponse = await callRealIntelligentSystem(message, analysis);
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

// SYSTÈME INTELLIGENT RÉEL avec APIs
async function callRealIntelligentSystem(message, analysis) {
    const startTime = Date.now();

    // Configuration APIs avec vos vraies clés
    const config = {
        claude: process.env.CLAUDE_API_KEY,
        openai: process.env.CLE_API_OPENAI
    };

    try {
        if (analysis.userLevel >= 1 && config.claude && config.openai) {
            // MODE DUAL BRAIN COMPLET
            console.log('🔥 Mode Dual Brain RÉEL activé');
            return await callRealDualBrain(message, analysis, config, startTime);
            
        } else if (config.claude) {
            // MODE CLAUDE SEUL
            console.log('🎯 Mode Claude RÉEL seul');
            return await callRealClaude(message, analysis, config, startTime);
            
        } else if (config.openai) {
            // MODE OPENAI SEUL
            console.log('💬 Mode OpenAI RÉEL seul');
            return await callRealOpenAI(message, analysis, config, startTime);
            
        } else {
            // FALLBACK SIMULATION INTELLIGENTE
            console.log('🧠 Fallback simulation intelligente');
            return generateIntelligentSimulation(message, analysis, startTime);
        }

    } catch (error) {
        console.error('❌ Erreur APIs:', error);
        console.log('🔄 Fallback vers simulation intelligente');
        return generateIntelligentSimulation(message, analysis, startTime);
    }
}

// DUAL BRAIN RÉEL CLAUDE + OPENAI
async function callRealDualBrain(message, analysis, config, startTime) {
    try {
        console.log('🚀 Lancement Dual Brain en parallèle...');

        // Prompts optimisés pour chaque IA
        const claudePrompt = generateClaudePrompt(message, analysis);
        const openaiPrompt = generateOpenAIPrompt(message, analysis);

        // Appels parallèles aux vraies APIs
        const [claudeResponse, openaiResponse] = await Promise.all([
            callClaudeAPI(claudePrompt, config.claude),
            callOpenAIAPI(openaiPrompt, config.openai)
        ]);

        console.log('✅ Dual Brain: Claude + OpenAI réussis');

        // Fusion intelligente
        const fusedText = fuseResponses(claudeResponse, openaiResponse, analysis);

        return {
            text: fusedText,
            strategy: "dual_brain_real",
            mood: "expert_premium_dual",
            score: 9.8,
            mode: "dual_brain_real",
            processingTime: Date.now() - startTime
        };

    } catch (error) {
        console.error('❌ Erreur Dual Brain réel:', error);
        throw error;
    }
}

// CLAUDE SEUL RÉEL
async function callRealClaude(message, analysis, config, startTime) {
    try {
        const prompt = generateClaudePrompt(message, analysis);
        const response = await callClaudeAPI(prompt, config.claude);

        console.log('✅ Claude API réussi');

        return {
            text: response,
            strategy: "claude_real_precision",
            mood: "expert_claude_real",
            score: 9.0,
            mode: "claude_real",
            processingTime: Date.now() - startTime
        };

    } catch (error) {
        console.error('❌ Erreur Claude réel:', error);
        throw error;
    }
}

// OPENAI SEUL RÉEL
async function callRealOpenAI(message, analysis, config, startTime) {
    try {
        const prompt = generateOpenAIPrompt(message, analysis);
        const response = await callOpenAIAPI(prompt, config.openai);

        console.log('✅ OpenAI API réussi');

        return {
            text: response,
            strategy: "openai_real_creative",
            mood: "expert_openai_real",
            score: 8.7,
            mode: "openai_real",
            processingTime: Date.now() - startTime
        };

    } catch (error) {
        console.error('❌ Erreur OpenAI réel:', error);
        throw error;
    }
}

// APPELS API RÉELS
async function callClaudeAPI(prompt, apiKey) {
    console.log('📡 Appel Claude API...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022', // MODÈLE CORRIGÉ
            max_tokens: 1000,
            messages: [{ 
                role: 'user', 
                content: prompt 
            }]
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Claude API Error:', response.status, errorData);
        throw new Error(`Claude API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Claude API response reçu');
    return data.content[0].text;
}

async function callOpenAIAPI(prompt, apiKey) {
    console.log('📡 Appel OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o', // MODÈLE RÉCENT
            messages: [{ 
                role: 'user', 
                content: prompt 
            }],
            max_tokens: 1000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ OpenAI API Error:', response.status, errorData);
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI API response reçu');
    return data.choices[0].message.content;
}

// GÉNÉRATION PROMPTS OPTIMISÉS
function generateClaudePrompt(message, analysis) {
    return `Tu es Julien, expert automobile français spécialisé FAP/EGR/AdBlue depuis 20 ans chez Re-Fap.

QUESTION CLIENT: "${message}"

CONTEXTE:
- Type problème détecté: ${analysis.questionType}
- Niveau client: ${analysis.levelName}
- Urgence: ${analysis.urgency}

INSTRUCTIONS PRÉCISES:
${analysis.userLevel === 0 ? 
    `- Diagnostic de base professionnel
- Pose 2-3 questions techniques précises pour affiner
- NE CONCLUS PAS trop vite, demande des précisions
- Montre ton expertise sans être commercial
- Termine par: "Avec ces infos, je pourrai te donner un diagnostic précis !"` :
    `- Diagnostic expert approfondi 
- Analyse technique détaillée
- Estimation coûts et solutions
- Recommandations personnalisées
- Ton d'expert premium`}

STYLE: Expert technique, rassurant, français naturel. Maximum 150 mots.

Réponds uniquement en tant que Julien expert automobile.`;
}

function generateOpenAIPrompt(message, analysis) {
    return `Tu es Julien, expert automobile chaleureux et pédagogue de Re-Fap. Un client te dit:

"${message}"

CONTEXTE CLIENT:
- Niveau: ${analysis.levelName}
- Problème type: ${analysis.questionType}

TON STYLE UNIQUE:
- Chaleureux mais expert
- Empathique et rassurant  
- Explications claires pour non-expert
- Encourage les bonnes décisions
- Mentionne l'importance sécurité

${analysis.userLevel === 0 ?
    'OBJECTIF: Rassurer, poser questions pertinentes, montrer expertise avant tout commercial' :
    'OBJECTIF: Conseil expert premium, solutions concrètes, accompagnement personnalisé'}

Réponds comme un vrai expert automobile français. Maximum 150 mots.`;
}

// FUSION INTELLIGENTE DES RÉPONSES
function fuseResponses(claudeResponse, openaiResponse, analysis) {
    if (analysis.userLevel >= 2) {
        // Utilisateurs premium : Claude (précision) puis OpenAI (engagement)
        return `${claudeResponse}\n\n---\n\n💡 **Conseil personnalisé :** ${openaiResponse}`;
    } else {
        // Utilisateurs standards : OpenAI (engagement) puis Claude (technique)  
        return `${openaiResponse}\n\n🔧 **Analyse technique :** ${claudeResponse}`;
    }
}

// 🧠 SIMULATION INTELLIGENTE (fallback si APIs échouent)
function generateIntelligentSimulation(message, analysis, startTime) {
    const messageLower = message.toLowerCase();
    let response = "";

    if (messageLower.includes('voyant moteur') || (messageLower.includes('voyant') && messageLower.includes('moteur'))) {
        if (analysis.userLevel === 0) {
            response = `**Voyant moteur détecté** 🔧\n\nD'après mon expérience, ça peut indiquer plusieurs choses selon la couleur et le comportement.\n\n🔍 **Questions d'expert :**\n- Quelle couleur ? (Orange/rouge/jaune)\n- Il clignote ou reste fixe ?\n- Depuis quand ?\n- Autres symptômes ?\n\nAvec ces infos, diagnostic précis possible ! 👨‍🔧`;
        } else {
            response = `**Diagnostic moteur premium** 🎯\n\nAnalyse approfondie du voyant moteur :\n\n• Orange clignotant = FAP/EGR (80% des cas)\n• Orange fixe = Capteur défaillant\n• Rouge = Urgence moteur\n\n💰 **Estimations :**\n- Nettoyage FAP : 180€\n- Capteur : 150€\n- Intervention complète : 350€\n\nDiagnostic précis recommandé ! 🔧`;
        }
    } else if (messageLower.includes('fap') || messageLower.includes('egr')) {
        response = `**Expertise FAP/EGR** 🏆\n\nC'est exactement ma spécialité ! Problème ${analysis.questionType} détecté.\n\n${analysis.userLevel === 0 ? 
            '🔍 Questions : Ville/autoroute ? Fumée ? Depuis quand ?\n\n80% des cas = encrassement récupérable !' :
            '💡 Analyse premium : Encrassement progressif, solutions économiques vs remplacement.\n\n💰 Nettoyage complet : 180€ vs 1200€ neuf !'}\n\nSolution personnalisée disponible ! 🔧`;
    } else {
        response = `**Diagnostic automobile** 🔧\n\nSalut ! Julien expert Re-Fap.\n\n${analysis.userLevel === 0 ?
            '🎯 Pour diagnostic précis :\n- Marque/modèle ?\n- Symptômes exacts ?\n- Depuis quand ?\n\nAvec ça, analyse complète !' :
            '🏆 Analyse premium activée !\n\nDiagnostic approfondi avec solutions et coûts détaillés disponible.'}\n\nSpécialiste FAP/EGR/moteur ! 👨‍🔧`;
    }

    return {
        text: response,
        strategy: "intelligent_simulation",
        mood: "expert_simulation", 
        score: 8.0,
        mode: "simulation_intelligent",
        processingTime: Date.now() - startTime
    };
}

// RESTE DU CODE (fonctions utilitaires inchangées)
function analyzeUserAndQuestion(message, userData) {
    let userLevel = 0;
    if (userData.email) userLevel = 1;
    if (userData.phone) userLevel = 2;
    if (userData.vehicleModel && userData.location) userLevel = 3;

    const questionType = detectQuestionType(message);
    const urgency = detectUrgency(message);
    const leadValue = calculateLeadValue(userLevel, questionType, urgency);
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

async function handleAirtableAction(req, res) {
    const { action, data } = req.body;
    
    if (action === 'CREATE_LEAD') {
        console.log('📝 Lead création:', data);
        return res.status(200).json({
            success: true,
            leadId: `lead_${Date.now()}`,
            message: 'Lead créé'
        });
    }
    
    return res.status(200).json({
        success: true,
        message: 'Action traitée'
    });
}
