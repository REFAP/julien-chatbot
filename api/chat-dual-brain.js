// api/chat-dual-brain.js
// Système complet : Dual Brain (Claude + OpenAI) + Airtable + Lead Generation

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
        const { message, userData = {}, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message requis' });
        }

        console.log('🧠 Dual Brain démarré:', { message, userData, sessionId });

        // 1. ANALYSE UTILISATEUR ET QUESTION
        const analysis = analyzeUserAndQuestion(message, userData);
        console.log('📊 Analyse:', analysis);

        // 2. APPEL DUAL BRAIN INTELLIGENT
        const aiResponse = await callIntelligentSystem(message, analysis);
        console.log('🤖 Réponse IA:', aiResponse.mode);

        // 3. CIRCUIT DE RÉCOMPENSE
        const rewardStrategy = generateRewardStrategy(analysis.userLevel, analysis.questionType);

        // 4. ENREGISTREMENT AIRTABLE
        await logInteractionToAirtable(message, aiResponse, analysis, sessionId);

        // 5. GÉNÉRATION LEAD SI APPLICABLE
        let leadInfo = null;
        if (analysis.userLevel > 0 && analysis.leadValue > 0) {
            leadInfo = await createLeadInAirtable(userData, analysis, sessionId);
        }

        // 6. RÉPONSE FINALE
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
        
        // Fallback sur Airtable en cas d'erreur
        const fallbackResponse = await getFallbackFromAirtable(req.body.message);
        
        return res.status(200).json({
            success: true,
            message: fallbackResponse,
            strategy: "airtable_fallback",
            score: 6.0,
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

// SYSTÈME INTELLIGENT DUAL BRAIN
async function callIntelligentSystem(message, analysis) {
    const startTime = Date.now();

    // Configuration APIs
    const config = {
        claude: process.env.CLAUDE_API_KEY,
        openai: process.env.CLE_API_OPENAI
    };

    try {
        if (analysis.userLevel >= 1 && config.claude && config.openai) {
            // MODE DUAL BRAIN COMPLET
            console.log('🔥 Mode Dual Brain activé');
            return await callDualBrainFusion(message, analysis, config, startTime);
            
        } else if (config.claude) {
            // MODE CLAUDE SEUL
            console.log('🎯 Mode Claude seul');
            return await callClaudeOnly(message, analysis, config, startTime);
            
        } else {
            // MODE AIRTABLE INTELLIGENT
            console.log('📚 Mode Airtable intelligent');
            return await callAirtableIntelligent(message, analysis, startTime);
        }

    } catch (error) {
        console.error('❌ Erreur IA:', error);
        return await callAirtableIntelligent(message, analysis, startTime);
    }
}

// DUAL BRAIN FUSION CLAUDE + OPENAI
async function callDualBrainFusion(message, analysis, config, startTime) {
    try {
        // Prompts optimisés
        const claudePrompt = `Tu es un expert automobile français. Analyse ce problème avec précision technique :

"${message}"

Type détecté: ${analysis.questionType}
Urgence: ${analysis.urgency}

Donne un diagnostic précis, factuel, sans conclusion hâtive. Pose des questions de clarification si nécessaire.`;

        const openaiPrompt = `Tu es Julien, expert Re-Fap chaleureux. Un client dit :

"${message}"

Réponds avec empathie, rassure, explique simplement. Ton style : expert mais accessible, propose des solutions concrètes.`;

        // Appels parallèles
        const [claudeResponse, openaiResponse] = await Promise.all([
            callClaudeAPI(claudePrompt, config.claude),
            callOpenAIAPI(openaiPrompt, config.openai)
        ]);

        // Fusion intelligente
        const fusedText = fuseResponses(claudeResponse, openaiResponse, analysis);

        return {
            text: fusedText,
            strategy: "dual_brain_fusion",
            mood: "expert_premium",
            score: 9.5,
            mode: "dual_brain",
            processingTime: Date.now() - startTime
        };

    } catch (error) {
        console.error('❌ Erreur Dual Brain:', error);
        throw error;
    }
}

// CLAUDE SEUL
async function callClaudeOnly(message, analysis, config, startTime) {
    const prompt = `Tu es Julien, expert automobile Re-Fap. Problème client :

"${message}"

Type: ${analysis.questionType}
Niveau utilisateur: ${analysis.levelName}

${analysis.userLevel === 0 ? 
    'Donne un diagnostic de base puis propose un diagnostic premium contre email.' :
    'Donne un diagnostic approfondi avec recommandations précises.'}

Réponds en français, sois professionnel et rassurant.`;

    const response = await callClaudeAPI(prompt, config.claude);

    return {
        text: response,
        strategy: "claude_precision",
        mood: "expert_analysis", 
        score: 8.5,
        mode: "claude_only",
        processingTime: Date.now() - startTime
    };
}

// AIRTABLE INTELLIGENT
async function callAirtableIntelligent(message, analysis, startTime) {
    try {
        // Récupération knowledge base
        const knowledge = await getAirtableKnowledge();
        
        // Recherche dans la base
        const bestMatch = findBestKnowledgeMatch(message, analysis.questionType, knowledge);
        
        if (bestMatch) {
            // Incrémenter utilisation
            await updateKnowledgeUsage(bestMatch.id);
            
            return {
                text: formatKnowledgeResponse(bestMatch, analysis),
                strategy: "airtable_intelligent",
                mood: "knowledge_base",
                score: 7.5,
                mode: "airtable",
                processingTime: Date.now() - startTime
            };
        } else {
            // Réponse générique
            return {
                text: generateGenericResponse(analysis),
                strategy: "generic_fallback",
                mood: "standard",
                score: 6.0,
                mode: "fallback",
                processingTime: Date.now() - startTime
            };
        }

    } catch (error) {
        console.error('❌ Erreur Airtable:', error);
        return {
            text: generateGenericResponse(analysis),
            strategy: "error_fallback",
            mood: "standard", 
            score: 5.0,
            mode: "error",
            processingTime: Date.now() - startTime
        };
    }
}

// APPELS API
async function callClaudeAPI(prompt, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

async function callOpenAIAPI(prompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// FUSION INTELLIGENTE
function fuseResponses(claudeResponse, openaiResponse, analysis) {
    if (analysis.userLevel >= 2) {
        // Utilisateurs premium : Claude en premier (précision)
        return `${claudeResponse}\n\n---\n\n💡 **Conseil d'expert :** ${openaiResponse}`;
    } else {
        // Utilisateurs standards : OpenAI en premier (engagement)
        return `${openaiResponse}\n\n🔧 **Analyse technique :** ${claudeResponse}`;
    }
}

// AIRTABLE OPERATIONS
async function getAirtableKnowledge() {
    const AIRTABLE_TOKEN = 'patf3ZGIrQfnBsg8a.ab3b4eb79a58c1fbc413fe1ed37948fce5faaa1297a760fbaadf99ebca9341b2';
    const BASE_ID = 'appKdP1OPj7KiSmS0';
    const TABLE_ID = 'tblgByZxuT7vp4wW8';

    const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?maxRecords=100`,
        {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error('Erreur Airtable knowledge');
    }

    const data = await response.json();
    return data.records.map(record => ({
        id: record.id,
        categorie: record.fields.Categorie || '',
        symptomes: record.fields.Symptomes_Cles || '',
        reponse: record.fields.Reponse_Type || '',
        arguments: record.fields.Arguments_Commercial || '',
        cta: record.fields.CTA_Recommande || ''
    }));
}

async function logInteractionToAirtable(message, aiResponse, analysis, sessionId) {
    try {
        // Création diagnostic
        const diagnosticData = {
            action: 'CREATE_DIAGNOSTIC',
            data: {
                symptomes: message,
                diagnostic: aiResponse.text,
                solution: analysis.partner,
                resultat: `${analysis.levelName} - ${aiResponse.mode}`
            }
        };

        await callAirtableAPI(diagnosticData);
        console.log('✅ Interaction loggée dans Airtable');

    } catch (error) {
        console.warn('⚠️ Erreur log Airtable:', error.message);
    }
}

async function createLeadInAirtable(userData, analysis, sessionId) {
    try {
        const leadData = {
            action: 'CREATE_LEAD',
            data: {
                nom: userData.firstName || 'Prospect',
                telephone: userData.phone || '',
                email: userData.email || '',
                sessionId,
                probleme: `${analysis.questionType} - ${analysis.urgency}`,
                vehicule: userData.vehicleModel || '',
                source: 'Dual Brain Chatbot'
            }
        };

        const result = await callAirtableAPI(leadData);
        console.log('💰 Lead créé:', result.leadId);

        return {
            leadId: result.leadId,
            value: analysis.leadValue,
            partner: analysis.partner
        };

    } catch (error) {
        console.warn('⚠️ Erreur création lead:', error.message);
        return null;
    }
}

async function callAirtableAPI(data) {
    const response = await fetch('/api/airtable-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Erreur API Airtable');
    }

    return await response.json();
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

function findBestKnowledgeMatch(message, questionType, knowledge) {
    // Recherche par catégorie d'abord
    let matches = knowledge.filter(k => 
        k.categorie.toLowerCase().includes(questionType) ||
        k.symptomes.toLowerCase().includes(message.toLowerCase().substring(0, 20))
    );

    if (matches.length === 0) {
        // Recherche plus large
        matches = knowledge.filter(k => 
            message.toLowerCase().split(' ').some(word => 
                word.length > 3 && k.symptomes.toLowerCase().includes(word)
            )
        );
    }

    return matches[0] || null;
}

function formatKnowledgeResponse(match, analysis) {
    let response = match.reponse;
    
    if (match.arguments) {
        response += `\n\n💡 **À savoir :** ${match.arguments}`;
    }
    
    if (analysis.userLevel === 0 && match.cta) {
        response += `\n\n🔓 **${match.cta}** - Laissez votre email pour un diagnostic personnalisé !`;
    }
    
    return response;
}

function generateGenericResponse(analysis) {
    const responses = {
        'engine': `**Problème moteur détecté**\n\nD'après votre description, plusieurs causes sont possibles. Pour un diagnostic précis, il faudrait plus d'informations sur les symptômes exacts.`,
        'brakes': `**Problème de freinage identifié**\n\nLes freins sont un élément de sécurité critique. Je recommande une vérification rapide chez un professionnel.`,
        'general': `**Diagnostic automobile nécessaire**\n\nPour vous aider efficacement, j'aurais besoin de plus de détails sur les symptômes et le comportement du véhicule.`
    };

    return responses[analysis.questionType] || responses.general;
}

async function updateKnowledgeUsage(knowledgeId) {
    try {
        await callAirtableAPI({
            action: 'UPDATE_KNOWLEDGE_USAGE',
            data: { knowledgeId }
        });
    } catch (error) {
        console.warn('⚠️ Erreur update usage:', error.message);
    }
}

async function getFallbackFromAirtable(message) {
    try {
        const knowledge = await getAirtableKnowledge();
        const match = findBestKnowledgeMatch(message, 'general', knowledge);
        
        return match ? match.reponse : "Je rencontre un problème technique temporaire. Pouvez-vous reformuler votre question ?";
        
    } catch (error) {
        return "Service temporairement indisponible. Veuillez réessayer dans quelques instants.";
    }
}
