// api/analyze-image.js
// Vercel Function pour analyser les photos avec Claude Vision

export default async function handler(request, response) {
    // Autoriser CORS
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Gérer les requêtes OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // Seules les requêtes POST sont autorisées
    if (request.method !== 'POST') {
        return response.status(405).json({ 
            error: 'Méthode non autorisée. Utilisez POST.' 
        });
    }

    try {
        // CONTRÔLE CONSOMMATION - Vérifications préliminaires
        const clientIP = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        // Rate limiting simple (à améliorer avec Redis en prod)
        // Limite : 50 requêtes par IP par jour
        const rateLimitKey = `${clientIP}-${today}`;
        
        // Log de suivi consommation
        console.log('📊 TRACKING USAGE:', {
            timestamp: now.toISOString(),
            ip: clientIP,
            userAgent: request.headers['user-agent']?.substring(0, 100),
            rateLimitKey
        });

        // Récupérer les données de la requête
        const { image, conversation, prompt } = request.body;

        // Récupérer la clé API depuis les variables d'environnement
        const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
        
        if (!CLAUDE_API_KEY) {
            console.error('❌ Clé API Claude manquante');
            return response.status(500).json({ 
                error: 'Configuration API manquante',
                fallback: generateFallbackAnalysis()
            });
        }

        let messageContent = [];
        let tokensEstimes = 0;
        
        // Si c'est une conversation (pas d'image)
        if (conversation && Array.isArray(conversation)) {
            // Mode dialogue pur - Claude fait tout
            console.log('🔄 Mode conversation détecté, messages:', conversation.length);
            
            // Nettoyer et valider les messages
            const cleanMessages = conversation
                .filter(msg => msg.content && msg.content.trim().length > 0)
                .map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: String(msg.content).trim().slice(0, 500) // LIMITE: 500 chars par message
                }));
            
            // Limiter le nombre de messages dans l'historique
            const limitedMessages = cleanMessages.slice(-4); // LIMITE: 4 derniers messages max
            
            // Estimation tokens (approximatif)
            tokensEstimes = limitedMessages.reduce((total, msg) => total + (msg.content.length / 4), 0);
            
            console.log('💰 ESTIMATION TOKENS:', {
                messagesCount: limitedMessages.length,
                tokensEstimes: Math.round(tokensEstimes),
                cout_estime_usd: (tokensEstimes * 0.000015).toFixed(6) // ~$0.015 per 1K tokens
            });
            
            // LIMITE SÉCURITÉ: Refuser si trop de tokens
            if (tokensEstimes > 400) {
                console.warn('⚠️ LIMITE TOKENS DÉPASSÉE:', tokensEstimes);
                return response.status(429).json({
                    error: 'Conversation trop longue',
                    fallback: "Conversation trop longue ! Essaie de résumer ton problème en quelques mots : voyants allumés, fumées, marque véhicule. Je vais t'aider !"
                });
            }
            
            // S'assurer qu'on a au moins un message user
            if (limitedMessages.length === 0 || limitedMessages[limitedMessages.length - 1].role !== 'user') {
                return response.status(400).json({
                    error: 'Aucun message utilisateur valide',
                    fallback: generateFallbackAnalysis()
                });
            }
            
            console.log('📤 Envoi à Claude:', JSON.stringify(limitedMessages, null, 2));
            
            const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': CLAUDE_API_KEY,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 200, // LIMITE: 200 tokens max par réponse
                    messages: limitedMessages,
                    system: (prompt || "Tu es Julien, expert FAP/EGR/AdBlue depuis 20 ans chez Re-Fap. Réponds comme un vrai mécano expert : direct, précis, conversationnel. Analyse les symptômes et guide vers des solutions Re-Fap.").slice(0, 800) // LIMITE: prompt 800 chars
                })
            });

            const responseText = await claudeResponse.text();
            console.log('📥 Réponse brute Claude:', claudeResponse.status, responseText.substring(0, 200));

            if (!claudeResponse.ok) {
                console.error('❌ Erreur Claude Conversation:', claudeResponse.status, responseText);
                
                return response.status(500).json({
                    error: `Erreur Claude Conversation: ${claudeResponse.status}`,
                    fallback: generateFallbackAnalysis(),
                    debug: responseText.substring(0, 200)
                });
            }

            const claudeData = JSON.parse(responseText);
            
            // LOG DÉTAILLÉ CONSOMMATION
            const tokensUtilises = (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0);
            const coutEstime = tokensUtilises * 0.000015; // $0.015 per 1K tokens Sonnet
            
            console.log('💸 CONSOMMATION RÉELLE:', {
                timestamp: now.toISOString(),
                ip: clientIP,
                type: 'conversation',
                input_tokens: claudeData.usage?.input_tokens,
                output_tokens: claudeData.usage?.output_tokens,
                total_tokens: tokensUtilises,
                cout_usd: coutEstime.toFixed(6),
                messages_count: limitedMessages.length
            });

            return response.status(200).json({
                success: true,
                analysis: claudeData.content[0].text,
                metadata: {
                    timestamp: now.toISOString(),
                    model: 'claude-3-5-sonnet',
                    type: 'conversation',
                    tokensUsed: tokensUtilises,
                    costUSD: coutEstime.toFixed(6)
                }
            });
        }
        
        // Mode analyse d'image (code existant avec limites)
        if (!image) {
            return response.status(400).json({ 
                error: 'Image ou conversation manquante' 
            });
        }

        // LIMITE: Taille image
        if (image.length > 2 * 1024 * 1024) { // 2MB en base64
            console.warn('⚠️ IMAGE TROP GROSSE:', image.length);
            return response.status(413).json({
                error: 'Image trop lourde',
                fallback: "Image trop lourde ! Compresse-la ou décris-moi ce que tu vois : voyants allumés, messages affichés, marque véhicule."
            });
        }

        // Préparer l'image (retirer le préfixe data:image)
        let imageData;
        let mediaType = 'image/jpeg';
        
        if (image.startsWith('data:image/')) {
            const [header, base64Data] = image.split(',');
            imageData = base64Data;
            
            // Détecter le type d'image
            if (header.includes('png')) mediaType = 'image/png';
            else if (header.includes('jpeg') || header.includes('jpg')) mediaType = 'image/jpeg';
        } else {
            imageData = image;
        }

        messageContent = [
            {
                type: "text",
                text: (prompt || `Tu es Julien, expert FAP/EGR/AdBlue depuis 20 ans chez Re-Fap. 

ANALYSE CETTE PHOTO et réponds avec la LOGIQUE BUSINESS BI-CÉPHAL :

🟢 SI PROBLÈME FAP/EGR/AdBlue détecté :
1. DIAGNOSTIC précis : "Je vois [voyant X] allumé, c'est ton FAP qui déconne !"
2. ARGUMENTATION commerciale : 
   - "Nettoyage Re-Fap : 200€ et 24h"
   - "FAP neuf : 2000€ et 1 semaine d'immobilisation"
   - "Lequel tu choisis ? 😉"
3. QUALIFICATION : "Tu es bricoleur ou tu préfères confier ça à un pro ?"
4. URGENCE : "Plus tu attends, plus ça coûte cher !"

🔴 SI AUTRE PROBLÈME :
1. DIAGNOSTIC : "Ça c'est pas le FAP, c'est [problème X]"
2. REDIRECTION : "Moi je suis spécialisé FAP, pour ça va voir un garage partenaire Re-Fap"
3. CTA : "Tu veux que je te trouve un garage de confiance près de chez toi ?"

INDICATEURS FAP/EGR :
- Voyants moteur, antipollution, FAP, EGR
- Codes P2002, P2463, P0401
- Fumées, perte puissance, surconsommation

STYLE JULIEN :
- Direct et commercial naturel
- "Ah !", "Je vois direct que...", "Mon diagnostic..."
- TOUJOURS terminer par une question + action
- Pousser vers LA solution Re-Fap appropriée

SOIS COMMERCIAL MAIS NATUREL !`).slice(0, 800) // LIMITE: prompt 800 chars
            },
            {
                type: "image",
                source: {
                    type: "base64",
                    media_type: mediaType,
                    data: imageData
                }
            }
        ];

        console.log('💰 ANALYSE IMAGE - Estimation coût élevé (~$0.05)');

        // Appel à Claude Vision API
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': CLAUDE_API_KEY,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 400, // AUGMENTÉ: 400 tokens pour éviter les coupures
                messages: [{
                    role: "user",
                    content: messageContent
                }]
            })
        });

        if (!claudeResponse.ok) {
            const errorData = await claudeResponse.text();
            console.error('❌ Erreur Claude API:', claudeResponse.status, errorData);
            
            return response.status(500).json({
                error: `Erreur Claude API: ${claudeResponse.status}`,
                fallback: generateFallbackAnalysis(image),
                debug: process.env.NODE_ENV === 'development' ? errorData.substring(0, 200) : undefined
            });
        }

        const claudeData = await claudeResponse.json();
        
        // LOG DÉTAILLÉ CONSOMMATION IMAGE
        const tokensUtilises = (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0);
        const coutEstime = tokensUtilises * 0.000015; // Vision coûte plus cher en réalité
        
        console.log('💸 CONSOMMATION IMAGE:', {
            timestamp: now.toISOString(),
            ip: clientIP,
            type: 'image_analysis',
            input_tokens: claudeData.usage?.input_tokens,
            output_tokens: claudeData.usage?.output_tokens,
            total_tokens: tokensUtilises,
            cout_usd: coutEstime.toFixed(6),
            image_size_kb: Math.round(image.length / 1024)
        });

        // Retourner l'analyse
        return response.status(200).json({
            success: true,
            analysis: claudeData.content[0].text,
            metadata: {
                timestamp: now.toISOString(),
                model: 'claude-3-5-sonnet',
                tokensUsed: tokensUtilises,
                costUSD: coutEstime.toFixed(6)
            }
        });

    } catch (error) {
        console.error('💥 Erreur serveur:', error);
        
        return response.status(500).json({
            error: 'Erreur interne du serveur',
            fallback: generateFallbackAnalysis(),
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Fonction de fallback intelligente
function generateFallbackAnalysis() {
    const responses = [
        `Salut ! Julien ici, expert FAP/EGR depuis 20 ans ! 

Décris-moi ton problème auto : voyants allumés, fumées, codes erreur... 

Je vais te donner un diagnostic précis ! 🔧`,

        `Hello ! C'est Julien, spécialiste dépollution Re-Fap !

Explique-moi tes symptômes : perte puissance, surconsommation, fumées...

Mon expertise à ton service ! 🎯`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}
