// api/send-callback.js
// Webhook simplifié pour envoyer les demandes de rappel par email

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
        const { 
            nom, 
            telephone, 
            email, 
            probleme, 
            vehicule, 
            sessionId,
            chatUrl 
        } = request.body;

        // Log pour debug
        console.log('📞 Demande de rappel reçue:', {
            nom,
            telephone,
            timestamp: new Date().toISOString()
        });

        // Validation des données obligatoires
        if (!nom || !telephone) {
            console.log('❌ Validation échouée: nom ou téléphone manquant');
            return response.status(400).json({
                error: 'Nom et téléphone obligatoires',
                success: false
            });
        }

        // Nettoyer les données
        const cleanData = {
            nom: String(nom).trim(),
            telephone: String(telephone).trim(),
            email: email ? String(email).trim() : 'Non renseigné',
            probleme: probleme ? String(probleme).trim() : 'Non précisé',
            vehicule: vehicule ? String(vehicule).trim() : 'Non précisé',
            sessionId: sessionId || 'N/A',
            timestamp: new Date().toLocaleString('fr-FR', {
                timeZone: 'Europe/Paris'
            }),
            chatUrl: chatUrl || 'N/A'
        };

        console.log('📋 Données nettoyées:', cleanData);

        // Récupérer la clé API Resend
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        
        if (!RESEND_API_KEY) {
            console.log('⚠️ RESEND_API_KEY manquante, données loggées seulement');
            
            // Logger les données pour récupération manuelle
            console.log('📧 DEMANDE RAPPEL (API manquante):', {
                destinataires: ['mgaume@re-fap.fr', 'contact@re-fap.fr'],
                ...cleanData
            });
            
            return response.status(200).json({
                success: true,
                message: 'Demande enregistrée (email en attente de configuration)',
                data: cleanData
            });
        }

        console.log('🔑 RESEND_API_KEY trouvée, envoi email...');

        // Email texte simple pour éviter les erreurs
        const emailText = `NOUVEAU RAPPEL RE-FAP - ${cleanData.nom}

INFORMATIONS CLIENT :
• Nom/Prénom : ${cleanData.nom}
• Téléphone : ${cleanData.telephone}
• Email : ${cleanData.email}

PROBLÈME VÉHICULE :
• Véhicule : ${cleanData.vehicule}
• Problème : ${cleanData.probleme}

DONNÉES CHATBOT :
• Session ID : ${cleanData.sessionId}
• Horodatage : ${cleanData.timestamp}
• URL conversation : ${cleanData.chatUrl}

ACTION REQUISE : Rappeler ${cleanData.nom} au ${cleanData.telephone} sous 2h !

---
Généré automatiquement par Julien Chatbot Re-Fap`;

        // Envoyer via Resend API
        console.log('📤 Envoi via Resend...');
        
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Julien Chatbot <onboarding@resend.dev>',
                to: ['mgaume@re-fap.fr', 'contact@re-fap.fr'],
                subject: `🔥 NOUVEAU RAPPEL RE-FAP - ${cleanData.nom}`,
                text: emailText
            })
        });

        console.log('📧 Réponse Resend:', emailResponse.status);

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('❌ Erreur Resend:', emailResponse.status, errorText);
            
            // Fallback : logger au minimum
            console.log('📧 DEMANDE RAPPEL (erreur envoi):', {
                destinataires: ['mgaume@re-fap.fr', 'contact@re-fap.fr'],
                erreur: errorText,
                ...cleanData
            });
            
            return response.status(500).json({
                success: false,
                error: 'Erreur envoi email',
                details: errorText,
                data: cleanData
            });
        }

        const emailResult = await emailResponse.json();
        
        // Log succès
        console.log('✅ Email envoyé avec succès:', {
            emailId: emailResult.id,
            destinataires: ['mgaume@re-fap.fr', 'contact@re-fap.fr'],
            client: cleanData.nom,
            telephone: cleanData.telephone
        });

        return response.status(200).json({
            success: true,
            message: 'Email envoyé avec succès',
            emailId: emailResult.id,
            destinataires: ['mgaume@re-fap.fr', 'contact@re-fap.fr'],
            data: cleanData
        });

    } catch (error) {
        console.error('💥 Erreur serveur callback:', error.message);
        console.error('Stack trace:', error.stack);
        
        return response.status(500).json({
            success: false,
            error: 'Erreur serveur',
            message: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
