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
        // Récupérer les données de la requête
        const { image, prompt } = request.body;

        // Vérifier que l'image est fournie
        if (!image) {
            return response.status(400).json({ 
                error: 'Image manquante' 
            });
        }

        // Récupérer la clé API depuis les variables d'environnement
        const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
        
        if (!CLAUDE_API_KEY) {
            console.error('❌ Clé API Claude manquante');
            return response.status(500).json({ 
                error: 'Configuration API manquante',
                fallback: generateFallbackAnalysis(image)
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
                max_tokens: 500,
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt || `Tu es Julien, expert FAP/EGR/AdBlue depuis 20 ans chez Re-Fap. Analyse cette photo de tableau de bord automobile et réponds COMME JULIEN :

🔍 ANALYSE PRÉCISE :
1. Quels voyants sont allumés (couleur, forme, position) ?
2. Y a-t-il des messages d'erreur affichés ?
3. Peux-tu identifier la marque/modèle du véhicule ?
4. Si voyant FAP/moteur/antipollution : quel est ton diagnostic expert ?

💬 TON DE JULIEN :
- Direct, précis, professionnel mais humain
- "Je vois...", "Mon diagnostic...", "Ma recommandation..."
- Propose solution Re-Fap si problème dépollution
- Sinon redirige vers diagnostic mécanique général
- Termine par une question pour continuer le diagnostic
- Reste dans ta spécialité FAP/EGR/AdBlue

🎯 OBJECTIF : Générer un lead qualifié pour Re-Fap`
                        },
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: mediaType,
                                data: imageData
                            }
                        }
                    ]
                }]
            })
        });

        if (!claudeResponse.ok) {
            const errorData = await claudeResponse.text();
            console.error('❌ Erreur Claude API:', claudeResponse.status, errorData);
            
            return response.status(500).json({
                error: `Erreur Claude API: ${claudeResponse.status}`,
                fallback: generateFallbackAnalysis(image),
                debug: process.env.NODE_ENV === 'development' ? errorData : undefined
            });
        }

        const claudeData = await claudeResponse.json();
        
        // Log pour debug (sans exposer la clé API)
        console.log('✅ Analyse Claude réussie:', {
            timestamp: new Date().toISOString(),
            tokensUsed: claudeData.usage?.input_tokens + claudeData.usage?.output_tokens,
            model: claudeData.model
        });

        // Retourner l'analyse
        return response.status(200).json({
            success: true,
            analysis: claudeData.content[0].text,
            metadata: {
                timestamp: new Date().toISOString(),
                model: 'claude-3-5-sonnet',
                tokensUsed: claudeData.usage?.input_tokens + claudeData.usage?.output_tokens
            }
        });

    } catch (error) {
        console.error('💥 Erreur serveur:', error);
        
        return response.status(500).json({
            error: 'Erreur interne du serveur',
            fallback: generateFallbackAnalysis(request.body?.image),
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Fonction de fallback intelligente
function generateFallbackAnalysis(imageData) {
    const responses = [
        `📸 **Photo reçue !** Je vois ton tableau de bord.

**Analyse en cours...** 🔍 L'IA n'est pas disponible actuellement, mais je peux t'aider !

**Dis-moi précisément :**
🟡 **Quels voyants** sont allumés (couleur, forme) ?
📱 **Messages affichés** ? ("Antipollution défaillante", "Mode dégradé"...)
🚗 **Marque/modèle** de ta voiture ?

**Voyants FAP typiques :**
- 🟡 Voyant moteur orange
- 🔸 Voyant FAP (forme de filtre)
- ⚡ Voyant préchauffage qui clignote

**Avec ces infos, je te donne un diagnostic précis !** 🎯`,

        `📸 **Photo analysée !** Je distingue ton tableau de bord.

**Questions de diagnostic :**
🔍 **Voyant principal** : Orange, rouge ou jaune ?
📍 **Position** : Gauche, centre ou droite du tableau ?
💬 **Message** : Y a-t-il du texte affiché sur l'écran ?
🏷️ **Véhicule** : Quelle marque/modèle ?

**Mon expertise Re-Fap :**
Je vais croiser tes réponses avec ma base de 500+ interventions pour te donner la solution la plus économique ! 💪`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}
