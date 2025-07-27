// === SYSTÈME DE TRACKING INFLUENCEURS POUR JULIEN-CHATBOT ===
// À intégrer dans https://julien-chatbot.vercel.app/

class InfluencerTracker {
    constructor() {
        this.webhookUrl = 'https://hooks.airtable.com/workflows/v1/genericWebhook/appGeEstBq3KYfqcq/wflouM2MWSvqLNiWB/wtrqBfGa4RaTglY1w';
        this.currentRef = null;
        this.sessionData = {};
        this.init();
    }

    init() {
        this.captureReferral();
        this.loadSessionData();
        this.logTrackingStatus();
    }

    // Capture du paramètre ?ref= depuis l'URL
    captureReferral() {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        
        if (ref) {
            this.currentRef = ref;
            // Stockage persistant
            sessionStorage.setItem('influencer_ref', ref);
            localStorage.setItem('influencer_ref', ref);
            sessionStorage.setItem('visit_timestamp', Date.now().toString());
            
            console.log('🎯 Référent influenceur capturé:', ref);
            this.trackVisit(ref);
        } else {
            // Récupérer depuis le stockage existant
            this.currentRef = sessionStorage.getItem('influencer_ref') || 
                             localStorage.getItem('influencer_ref');
        }
    }

    // Charger les données de session
    loadSessionData() {
        if (this.currentRef) {
            this.sessionData = {
                ref: this.currentRef,
                visitTime: sessionStorage.getItem('visit_timestamp'),
                pageViews: parseInt(sessionStorage.getItem('page_views') || '0') + 1,
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                landingPage: window.location.href
            };
            
            sessionStorage.setItem('page_views', this.sessionData.pageViews.toString());
        }
    }

    // Log du statut de tracking (pour debug)
    logTrackingStatus() {
        if (this.currentRef) {
            console.log('✅ Tracking actif pour l\'influenceur:', this.currentRef);
            console.log('📊 Session data:', this.sessionData);
        } else {
            console.log('⚠️ Aucun référent influenceur détecté');
        }
    }

    // Tracker une visite (analytics)
    trackVisit(ref) {
        const visitData = {
            type: 'visit',
            influencer_ref: ref,
            timestamp: new Date().toISOString(),
            session_data: this.sessionData
        };

        console.log('📊 Visite trackée:', visitData);
        // Optionnel : envoyer les analytics de visite
        // this.sendAnalytics(visitData);
    }

    // MÉTHODE PRINCIPALE : Tracker une conversion
    trackConversion(userData = {}) {
        const ref = this.currentRef || sessionStorage.getItem('influencer_ref');
        
        if (!ref) {
            console.warn('❌ Aucun référent influenceur pour cette conversion');
            return false;
        }

        const conversion = {
            influencer_ref: ref,
            user_data: JSON.stringify({
                ...userData,
                timestamp: new Date().toISOString(),
                session_data: this.sessionData
            })
        };

        console.log('💰 Conversion trackée:', conversion);
        
        // Envoyer vers Airtable
        this.sendToAirtable(conversion);
        
        // Incrémenter les stats locales
        this.updateLocalStats();
        
        return true;
    }

    // Envoyer la conversion vers Airtable
    async sendToAirtable(conversion) {
        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(conversion)
            });

            if (response.ok) {
                console.log('✅ Conversion envoyée vers Airtable avec succès');
                // Optionnel : afficher une notification à l'utilisateur
                this.showConversionSuccess();
            } else {
                console.error('❌ Erreur lors de l\'envoi vers Airtable:', response.status);
            }
        } catch (error) {
            console.error('❌ Erreur réseau lors de l\'envoi:', error);
            // Optionnel : retry logic ou stockage local pour retry plus tard
        }
    }

    // Mise à jour des stats locales
    updateLocalStats() {
        if (this.currentRef) {
            const currentCount = parseInt(localStorage.getItem(`conversions_${this.currentRef}`) || '0');
            localStorage.setItem(`conversions_${this.currentRef}`, (currentCount + 1).toString());
        }
    }

    // Affichage optionnel de succès (pour l'UX)
    showConversionSuccess() {
        // Vous pouvez personnaliser cette notification
        console.log('🎉 Lead généré avec succès pour l\'influenceur:', this.currentRef);
    }

    // Méthodes utilitaires publiques
    getTrackingStatus() {
        return {
            isTracking: !!this.currentRef,
            influencerRef: this.currentRef,
            sessionData: this.sessionData,
            conversions: this.getConversionsCount()
        };
    }

    getConversionsCount() {
        if (!this.currentRef) return 0;
        return parseInt(localStorage.getItem(`conversions_${this.currentRef}`) || '0');
    }

    // Reset du tracking (pour debug/test)
    resetTracking() {
        sessionStorage.clear();
        localStorage.removeItem('influencer_ref');
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('conversions_')) {
                localStorage.removeItem(key);
            }
        });
        this.currentRef = null;
        this.sessionData = {};
        console.log('🗑️ Tracking reset');
    }
}

// === INITIALISATION AUTOMATIQUE ===
let influencerTracker;

// Initialiser dès que le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        influencerTracker = new InfluencerTracker();
    });
} else {
    influencerTracker = new InfluencerTracker();
}

// === FONCTIONS GLOBALES POUR VOTRE CHATBOT ===

/**
 * Fonction principale à appeler lors d'une conversion
 * @param {Object} userData - Données de l'utilisateur/lead
 * @returns {boolean} - true si le tracking a réussi
 */
window.trackInfluencerConversion = function(userData) {
    if (!influencerTracker) {
        console.error('❌ Tracker non initialisé');
        return false;
    }
    
    return influencerTracker.trackConversion(userData);
};

/**
 * Obtenir le statut actuel du tracking
 * @returns {Object} - Informations sur le tracking actuel
 */
window.getInfluencerTrackingStatus = function() {
    if (!influencerTracker) return { isTracking: false };
    return influencerTracker.getTrackingStatus();
};

/**
 * Reset du tracking (pour debug)
 */
window.resetInfluencerTracking = function() {
    if (influencerTracker) {
        influencerTracker.resetTracking();
    }
};

// === EXEMPLES D'UTILISATION ===

/*
// Exemple 1 : Tracking d'une conversion simple
window.trackInfluencerConversion({
    nom: 'Jean Dupont',
    email: 'jean@example.com',
    probleme: 'Voyant moteur',
    ville: 'Paris'
});

// Exemple 2 : Tracking quand l'utilisateur soumet le formulaire
document.getElementById('contact-form').addEventListener('submit', function(e) {
    const formData = new FormData(e.target);
    window.trackInfluencerConversion({
        nom: formData.get('nom'),
        email: formData.get('email'),
        probleme: formData.get('probleme'),
        ville: formData.get('ville'),
        source: 'formulaire_contact'
    });
});

// Exemple 3 : Tracking d'une interaction chatbot
function onChatbotInteraction(userMessage, botResponse) {
    if (userMessage.includes('diagnostic') || userMessage.includes('problème')) {
        window.trackInfluencerConversion({
            action: 'chatbot_diagnostic',
            user_message: userMessage,
            bot_response: botResponse
        });
    }
}

// Exemple 4 : Vérifier le statut
console.log('Statut tracking:', window.getInfluencerTrackingStatus());
*/
