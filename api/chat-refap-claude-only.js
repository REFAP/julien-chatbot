<!DOCTYPE html>
<!-- Force redeploy to apply vercel.json -->
<html lang="fr">
<script>
// === SYSTÈME DE TRACKING INFLUENCEURS POUR JULIEN-CHATBOT ===
class InfluencerTracker {
    constructor() {
        this.webhookUrl = '/api/track-conversion';
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
                this.showConversionSuccess();
            } else {
                console.error('❌ Erreur lors de l\'envoi vers Airtable:', response.status);
            }
        } catch (error) {
            console.error('❌ Erreur réseau lors de l\'envoi:', error);
        }
    }

    // Mise à jour des stats locales
    updateLocalStats() {
        if (this.currentRef) {
            const currentCount = parseInt(localStorage.getItem(`conversions_${this.currentRef}`) || '0');
            localStorage.setItem(`conversions_${this.currentRef}`, (currentCount + 1).toString());
        }
    }

    // Affichage optionnel de succès
    showConversionSuccess() {
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

    // Reset du tracking
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
window.trackInfluencerConversion = function(userData) {
    if (!influencerTracker) {
        console.error('❌ Tracker non initialisé');
        return false;
    }
    return influencerTracker.trackConversion(userData);
};

window.getInfluencerTrackingStatus = function() {
    if (!influencerTracker) return { isTracking: false };
    return influencerTracker.getTrackingStatus();
};

window.resetInfluencerTracking = function() {
    if (influencerTracker) {
        influencerTracker.resetTracking();
    }
};
</script>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Julien - Ton assistant auto de confiance </title>
    <meta name="description" content="Diagnostic gratuit FAP/EGR/AdBlue avec Julien, ton assistant auto de confiance depuis 20 ans. Claude Re-Fap pour solutions économiques.">
    
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 overflow-x-hidden">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect } = React;

        const JulienRefapChatbot = () => {
            const [messages, setMessages] = useState([
                {
                    type: 'bot',
                    content: "Salut ! 👋 Moi c'est Julien, ton assistant auto de confiance depuis 20 ans chez Re-Fap. Je vais diagnostiquer ton problème GRATUITEMENT ! Décris-moi ton souci ou envoie une photo 📸",
                    timestamp: new Date()
                }
            ]);
            const [inputMessage, setInputMessage] = useState('');
            const [isTyping, setIsTyping] = useState(false);
            const [showCallbackForm, setShowCallbackForm] = useState(false);
            const [userData, setUserData] = useState({});
            const [callbackData, setCallbackData] = useState({
                nom: '',
                telephone: '',
                email: '',
                probleme: '',
                vehicule: ''
            });
            const [leadData, setLeadData] = useState({
                sessionId: Math.random().toString(36).substr(2, 9),
                startTime: new Date(),
                interactions: 0
            });

            // États Re-Fap Claude Only
            const [userLevel, setUserLevel] = useState(0);
            const [leadValue, setLeadValue] = useState(0);
            const [currentCTA, setCurrentCTA] = useState(null);

            useEffect(() => {
                trackEvent('session_start', { sessionId: leadData.sessionId });
            }, []);

            const trackEvent = (event, data = {}) => {
                console.log('📊 Event tracked:', event, data);
            };

            const addMessage = (content, type = 'bot', source = 'claude_refap') => {
                setMessages(prev => [...prev, {
                    type,
                    content,
                    timestamp: new Date(),
                    source
                }]);
            };

            // 🔧 FONCTION CLAUDE ONLY RE-FAP
            const getClaudeRefapResponse = async (userMsg) => {
                try {
                    console.log('🔧 Claude Re-Fap activé...');
                    
                    // Appel au nouveau endpoint Claude Only
                    const response = await fetch('/api/chat-refap-claude-only', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: userMsg,
                            userData: userData,
                            conversationHistory: messages.map(m => ({
                                role: m.type === 'user' ? 'user' : 'assistant',
                                content: m.content
                            }))
                        })
                    });

                    const data = await response.json();
                    
                    if (data.response) {
                        console.log('✅ Claude Re-Fap success');
                        
                        // Mise à jour des données utilisateur
                        if (data.userData) {
                            setUserData(data.userData);
                            setUserLevel(data.userData.niveau || 0);
                        }
                        
                        // Gestion des CTA
                        if (data.cta && data.cta.length > 0) {
                            setCurrentCTA(data.cta);
                        }
                        
                        setLeadData(prev => ({ ...prev, interactions: prev.interactions + 1 }));
                        
                        return {
                            text: data.response,
                            cta: data.cta,
                            score: 9.0
                        };
                    } else {
                        throw new Error(data.error || 'Erreur Claude Re-Fap');
                    }
                    
                } catch (error) {
                    console.error('❌ Erreur Claude Re-Fap:', error);
                    return {
                        text: `🔧 Julien Re-Fap - Petit souci technique...\n\nDécris-moi ton problème FAP, je vais t'aider ! Nettoyage Re-Fap 99-149€ vs remplacement 2000€.`,
                        cta: null,
                        score: 5.0
                    };
                }
            };

            // Gestion des CTA Re-Fap
            const handleCTAClick = (ctaData) => {
                console.log('🎯 CTA clicked:', ctaData);
                
                // Ouvrir le lien dans un nouvel onglet
                if (ctaData.lien) {
                    window.open(ctaData.lien, '_blank');
                    
                    // Message de confirmation
                    addMessage(`🎯 **${ctaData.titre}** ouvert dans un nouvel onglet !\n\n💡 Solution Re-Fap : ${ctaData.description}\n💰 Prix : ${ctaData.prix}`, 'bot', 'cta_result');
                }
            };

            const handleSendMessage = async (e) => {
                e.preventDefault();
                if (!inputMessage.trim()) return;
                
                const userMsg = inputMessage.trim();
                addMessage(userMsg, 'user');
                setInputMessage('');
                setIsTyping(true);

                trackEvent('message_sent', { 
                    message: userMsg.substring(0, 50),
                    userLevel
                });

                // Appel Claude Re-Fap Only
                const response = await getClaudeRefapResponse(userMsg);
                addMessage(response.text, 'bot', 'claude_refap');
                
                // Gestion CTA
                if (response.cta) {
                    setCurrentCTA(response.cta);
                }
                
                setIsTyping(false);
            };

            const handleImageUpload = async (event) => {
                const file = event.target.files[0];
                if (file) {
                    if (!file.type.startsWith('image/')) {
                        alert('📸 Merci d\'envoyer une image (JPG, PNG...)');
                        return;
                    }
                    
                    addMessage(`📸 Photo envoyée : ${file.name}`, 'user');
                    setIsTyping(true);
                    trackEvent('photo_uploaded', { 
                        fileName: file.name, 
                        fileSize: file.size,
                        userLevel
                    });
                    
                    try {
                        // Analyse photo avec Claude Re-Fap
                        const photoPrompt = `Photo voyant tableau de bord - ${file.name}. Voyant FAP allumé, que faire ?`;
                        const response = await getClaudeRefapResponse(photoPrompt);
                        addMessage(`📸 **ANALYSE PHOTO RE-FAP** 🔧\n\n${response.text}`, 'bot', 'claude_refap');
                        
                        if (response.cta) {
                            setCurrentCTA(response.cta);
                        }
                        
                    } catch (error) {
                        console.error('❌ Erreur upload:', error);
                        addMessage(`❌ Erreur analyse : ${error.message}`, 'bot');
                    }
                    
                    setIsTyping(false);
                    event.target.value = '';
                }
            };

            const handleGarageClick = () => {
                trackEvent('garage_redirect', { sessionId: leadData.sessionId, userLevel });
                window.open('https://re-fap.fr/trouver_garage_partenaire/', '_blank');
            };

            const handleCallbackClick = () => {
                trackEvent('callback_requested', { sessionId: leadData.sessionId, userLevel });
                setShowCallbackForm(true);
                addMessage("Je souhaite être rappelé gratuitement", 'user');
                setTimeout(() => {
                    addMessage("📞 **Formulaire de rappel activé !**\n\nRemplis le formulaire pour être recontacté par un expert Re-Fap ! 🎯", 'bot', 'form');
                }, 500);
            };

            const handleCallbackSubmit = async (e) => {
                e.preventDefault();
                
                if (!callbackData.nom || !callbackData.telephone) {
                    alert('Nom et téléphone obligatoires !');
                    return;
                }

                // Mise à jour userData pour niveau 2
                const newUserData = {
                    ...userData,
                    email: callbackData.email,
                    phone: callbackData.telephone,
                    firstName: callbackData.nom,
                    vehicleModel: callbackData.vehicule,
                    niveau: 2
                };
                setUserData(newUserData);
                setUserLevel(2);
                setLeadValue(150);

                try {
                    console.log('📧 Envoi lead Re-Fap...');
                    
                    // Tracking de la conversion influenceur
                    if (window.trackInfluencerConversion) {
                        window.trackInfluencerConversion({
                            nom: callbackData.nom,
                            email: callbackData.email,
                            telephone: callbackData.telephone,
                            probleme: callbackData.probleme,
                            vehicule: callbackData.vehicule,
                            action: 'callback_requested',
                            leadValue: 150,
                            userLevel: 2
                        });
                    }

                    // Email avec les nouvelles infos Re-Fap
                    const emailBody = `NOUVEAU LEAD RE-FAP - ${callbackData.nom}

🔧 CLAUDE RE-FAP ASSISTANT
💰 Valeur lead : 150€
📊 Level : 2 (Expert)
🎯 Interactions : ${leadData.interactions}

📋 INFORMATIONS :
• Nom : ${callbackData.nom}
• Téléphone : ${callbackData.telephone}
• Email : ${callbackData.email || 'Non renseigné'}
• Véhicule : ${callbackData.vehicule || 'Non précisé'}
• Problème : ${callbackData.probleme || 'Non précisé'}

Session: ${leadData.sessionId}
Assistant: Claude Re-Fap Only`;

                    const mailtoLink = `mailto:mgaume@re-fap.fr?subject=${encodeURIComponent('🔧 LEAD RE-FAP - ' + callbackData.nom)}&body=${encodeURIComponent(emailBody)}`;
                    
                    window.open(mailtoLink, '_blank');

                    addMessage(`📧 **Email client ouvert !**
🔧 **Lead Re-Fap généré (150€)**

💬 **Instructions :**
1. Email pré-rempli ouvert
2. Clique "Envoyer"  
3. Rappel expert Re-Fap sous 2h !

🎯 **Ton niveau expert est activé !**`, 'bot', 'mailto_success');

                } catch (error) {
                    console.error('Erreur callback:', error);
                    addMessage(`❌ Erreur envoi : ${error.message}`, 'bot');
                }

                setShowCallbackForm(false);
                setCallbackData({ nom: '', telephone: '', email: '', probleme: '', vehicule: '' });
            };

            const getLevelName = () => {
                const names = {
                    0: 'Aide Gratuite',
                    1: 'Accompagnement Re-Fap', 
                    2: 'Support Expert'
                };
                return names[userLevel] || 'Assistant';
            };

            return (
                <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
                    {/* Header avec stats Re-Fap */}
                    <header className="bg-white shadow-sm border-b">
                        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0 flex-1">
                                    <div className="mr-2 sm:mr-3 bg-gradient-to-r from-green-500 to-green-600 px-2 sm:px-4 py-1 sm:py-2 rounded-lg shadow-sm">
                                        <span className="text-white font-bold text-sm sm:text-lg">re-fap</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-sm sm:text-lg font-bold text-gray-800 truncate">Julien - **Ton assistant auto de confiance**</h1>
                                        <p className="text-xs text-gray-600 hidden sm:block">
                                            Assistant Claude Re-Fap • Nettoyage FAP • Solutions économiques
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => window.open('https://re-fap.fr/trouver_garage_partenaire/', '_blank')}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ml-2 whitespace-nowrap"
                                >
                                    <span className="hidden sm:inline">🔍 Garage partenaire</span>
                                    <span className="sm:hidden">🔍</span>
                                </button>
                            </div>
                        </div>
                        
                        {/* Status Claude Re-Fap */}
                        <div className="text-xs text-center py-2 bg-gradient-to-r from-green-50 to-emerald-50">
                            <span className="text-green-600 font-medium">
                                🎯 Claude Re-Fap Only • Level {userLevel} • {leadData.interactions} interactions • Solutions économiques
                            </span>
                        </div>
                    </header>

                    {/* Chat principal */}
                    <div className="max-w-6xl mx-auto p-2 sm:p-4">
                        <div className="flex flex-col lg:flex-row gap-2 sm:gap-4">
                            {/* Chat */}
                            <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden">
                                {/* Header chat */}
                                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-2xl">🔧</span>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">Julien - **Ton assistant auto de confiance**</h2>
                                            <p className="text-green-100 text-sm">
                                                Claude Re-Fap • Nettoyage FAP • Anti-remplacement
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="h-96 overflow-y-auto p-2 sm:p-4 bg-gray-50">
                                    {messages.map((message, index) => (
                                        <div key={index} className={`mb-4 ${message.type === 'user' ? 'text-right' : ''}`}>
                                            <div className={`inline-block p-3 rounded-lg max-w-[85%] sm:max-w-md ${
                                                message.type === 'user' 
                                                    ? 'bg-green-500 text-white' 
                                                    : 'bg-white text-gray-800 border border-gray-200'
                                            }`}>
                                                {typeof message.content === 'string' ? 
                                                    message.content.split('\n').map((line, i) => (
                                                        <div key={i} className={line.startsWith('**') && line.endsWith('**') ? 'font-bold' : ''}>
                                                            {line.replace(/\*\*/g, '')}
                                                        </div>
                                                    )) : 
                                                    <div>Erreur affichage message</div>
                                                }
                                                
                                                {message.type === 'bot' && (
                                                    <div className="text-xs text-gray-400 mt-2">
                                                        🎯 Claude Re-Fap • {new Date(message.timestamp).toLocaleTimeString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* CTA Re-Fap - VERSION AMÉLIORÉE */}
                                    {currentCTA && currentCTA.length > 0 && (
                                        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg">
                                            <div className="text-center mb-3">
                                                <div className="text-lg font-bold text-green-800 mb-1">
                                                    🎯 **TES SOLUTIONS RE-FAP**
                                                </div>
                                                <div className="text-sm text-green-600">
                                                    👇 **CLIQUE pour passer à l'action immédiatement !**
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                {currentCTA.map((cta, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleCTAClick(cta)}
                                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-4 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-green-400 hover:border-green-300"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-left flex-1">
                                                                <div className="text-lg mb-1">
                                                                    {cta.emoji} **{cta.titre}**
                                                                </div>
                                                                <div className="text-sm opacity-90">
                                                                    {cta.description}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-bold">
                                                                    {cta.prix}
                                                                </div>
                                                                <div className="text-xs mt-1 opacity-80">
                                                                    👉 CLIQUER
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="text-center mt-3 text-xs text-green-700 font-medium">
                                                ⚡ **Action immédiate** • 🔧 **Solutions anti-arnaque** • 💰 **Économie garantie**
                                            </div>
                                        </div>
                                    )}
                                    
                                    {isTyping && (
                                        <div className="mb-4">
                                            <div className="inline-block bg-white p-3 rounded-lg border border-gray-200">
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600">Claude Re-Fap analyse... 🔧</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input */}
                                <div className="p-2 sm:p-4 border-t bg-white">
                                    <form onSubmit={handleSendMessage} className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder="💬 Décris ton problème..."
                                            className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                                            disabled={isTyping}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isTyping || !inputMessage.trim()}
                                            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                                        >
                                            <span className="hidden sm:inline">Envoyer</span>
                                            <span className="sm:hidden">📤</span>
                                        </button>
                                    </form>

                                    {/* Upload photo */}
                                    <div className="mb-3 p-2 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-dashed border-green-300">
                                        <div className="text-center">
                                            <input
                                                type="file"
                                                id="imageUpload"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={isTyping}
                                            />
                                            <label 
                                                htmlFor="imageUpload" 
                                                className="cursor-pointer bg-green-500 hover:bg-green-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg inline-flex items-center gap-2 font-medium transition-colors text-sm"
                                            >
                                                📸 <span className="hidden sm:inline">Photo de mon voyant</span><span className="sm:hidden">Photo</span>
                                            </label>
                                            <p className="text-xs text-gray-600 mt-2 px-2">
                                                JPG/PNG max 5MB • Analyse Claude Re-Fap ! 🔧
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick options Re-Fap */}
                                    <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-4 lg:mb-0">
                                        {[
                                            { text: "🟡 Voyant FAP", textMobile: "🟡 FAP", msg: "Voyant FAP allumé plus de puissance" },
                                            { text: "🔧 Je démonte", textMobile: "🔧 Démonte", msg: "Je peux démonter pour nettoyer" },
                                            { text: "🏪 Garage partenaire", textMobile: "🏪 Garage", msg: "je vais où?" },
                                            { text: "💰 Prix nettoyage", textMobile: "💰 Prix", msg: "Combien coûte nettoyage FAP?" }
                                        ].map((option, index) => (
                                            <button
                                                key={index}
                                                onClick={async () => {
                                                    addMessage(option.msg, 'user');
                                                    setIsTyping(true);
                                                    const response = await getClaudeRefapResponse(option.msg);
                                                    addMessage(response.text, 'bot', 'claude_refap');
                                                    if (response.cta) {
                                                        setCurrentCTA(response.cta);
                                                    }
                                                    setIsTyping(false);
                                                }}
                                                disabled={isTyping}
                                                className="bg-gray-100 hover:bg-gray-200 p-2 rounded text-xs sm:text-sm disabled:opacity-50 transition-colors"
                                            >
                                                <span className="hidden sm:inline">{option.text}</span>
                                                <span className="sm:hidden">{option.textMobile}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* CTA mobile */}
                                    <div className="lg:hidden p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                        <h4 className="font-bold text-green-800 text-sm mb-2 text-center">🔧 Solutions Re-Fap</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                onClick={handleGarageClick}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded text-sm font-medium transition-colors"
                                            >
                                                🔍 Garage partenaire Re-Fap
                                            </button>
                                            <button
                                                onClick={handleCallbackClick}
                                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded text-sm font-medium transition-colors"
                                            >
                                                📞 Être rappelé (expert FAP)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Section - DESKTOP */}
                            <div className="hidden lg:block w-64 space-y-4">
                                {/* Stats Claude Re-Fap */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 text-center">
                                    <h4 className="font-bold text-green-800 text-sm mb-1">🎯 Claude Re-Fap</h4>
                                    <div className="text-xs text-green-600 space-y-1">
                                        <div>Level: {getLevelName()}</div>
                                        <div>IA: Claude Only</div>
                                        <div>Lead: {leadValue}€</div>
                                        <div>Interactions: {leadData.interactions}</div>
                                    </div>
                                </div>

                                {/* Bouton Garage Re-Fap */}
                                <button
                                    onClick={handleGarageClick}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">🔍</div>
                                        <div className="font-bold">Garage partenaire</div>
                                        <div className="font-bold">Re-Fap</div>
                                        <div className="text-xs mt-1 opacity-90">Nettoyage FAP professionnel</div>
                                    </div>
                                </button>

                                {/* Bouton Rappel Re-Fap */}
                                <button
                                    onClick={handleCallbackClick}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">📞</div>
                                        <div className="font-bold">Expert FAP</div>
                                        <div className="font-bold">sous 2h</div>
                                        <div className="text-xs mt-1 opacity-90">Conseil gratuit nettoyage</div>
                                    </div>
                                </button>

                                {/* Liens Re-Fap */}
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                    <h4 className="font-bold text-gray-800 text-sm mb-2">🔗 Liens utiles</h4>
                                    <div className="space-y-2 text-xs">
                                        <a href="https://auto.re-fap.fr/carter-cash_machine_re-fap/" target="_blank" className="block text-blue-600 hover:underline">
                                            🏪 Carter-Cash équipés
                                        </a>
                                        <a href="https://auto.re-fap.fr/" target="_blank" className="block text-blue-600 hover:underline">
                                            📦 Service postal Re-Fap
                                        </a>
                                        <a href="https://www.idgarages.com/fr-fr/prestations/diagnostic-electronique?utm_source=re-fap" target="_blank" className="block text-blue-600 hover:underline">
                                            🔍 Diagnostic idGarages
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MODAL RAPPEL RE-FAP */}
                        {showCallbackForm && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-screen overflow-y-auto mx-2">
                                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 sm:p-4 rounded-t-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-base sm:text-lg font-bold">📞 Expert FAP Re-Fap</h3>
                                                <p className="text-xs sm:text-sm opacity-90">Conseil gratuit nettoyage</p>
                                            </div>
                                            <button 
                                                onClick={() => setShowCallbackForm(false)}
                                                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded ml-2"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    <form onSubmit={handleCallbackSubmit} className="p-4 sm:p-6 space-y-4">
                                        <div className="text-center mb-4">
                                            <div className="text-2xl mb-2">🔧</div>
                                            <p className="text-sm text-gray-600">
                                                Un expert Re-Fap va vous conseiller sur le nettoyage de votre FAP (80% d'économie vs remplacement).
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nom / Prénom *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={callbackData.nom}
                                                onChange={(e) => setCallbackData({...callbackData, nom: e.target.value})}
                                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                                                placeholder="Votre nom complet"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Téléphone *
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                value={callbackData.telephone}
                                                onChange={(e) => setCallbackData({...callbackData, telephone: e.target.value})}
                                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                                                placeholder="06 12 34 56 78"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={callbackData.email}
                                                onChange={(e) => setCallbackData({...callbackData, email: e.target.value})}
                                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                                                placeholder="votre@email.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Problème FAP
                                            </label>
                                            <textarea
                                                value={callbackData.probleme}
                                                onChange={(e) => setCallbackData({...callbackData, probleme: e.target.value})}
                                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                                                placeholder="Voyant FAP, perte puissance..."
                                                rows="3"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Véhicule
                                            </label>
                                            <input
                                                type="text"
                                                value={callbackData.vehicule}
                                                onChange={(e) => setCallbackData({...callbackData, vehicule: e.target.value})}
                                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                                                placeholder="Peugeot 308 2018"
                                            />
                                        </div>

                                        <div className="bg-green-50 p-2 sm:p-3 rounded-lg text-xs text-green-700">
                                            🔧 <strong>Expert Re-Fap :</strong>
                                            <br />• Conseil nettoyage FAP professionnel
                                            <br />• 99-149€ vs 2000€ remplacement
                                            <br />• Garantie 1 an, traitement 48h
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowCallbackForm(false)}
                                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 sm:py-3 px-4 rounded-lg font-medium transition-colors text-sm"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 sm:py-3 px-4 rounded-lg font-medium transition-colors text-sm"
                                            >
                                                📞 Expert Re-Fap
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Claude Re-Fap */}
                    <footer className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-gray-600">
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 mb-3">
                            <span className="flex items-center"><span className="text-green-500 mr-1">🎯</span> Claude Re-Fap</span>
                            <span className="flex items-center"><span className="text-blue-500 mr-1">📊</span> {getLevelName()}</span>
                            <span className="flex items-center"><span className="text-green-500 mr-1">💰</span> Économie 80%</span>
                            <span className="flex items-center"><span className="text-orange-500 mr-1">⚡</span> {leadData.interactions} interactions</span>
                        </div>
                        <p className="text-xs px-2">
                            Powered by <a href="https://re-fap.fr" className="text-orange-600 hover:underline">Re-Fap</a> • 
                            Claude Assistant • Nettoyage FAP professionnel •
                            <span className="hidden sm:inline"> 99-149€ vs 2000€ •</span>
                            <span className="block sm:inline"> Session: {leadData.sessionId}</span>
                        </p>
                    </footer>
                </div>
            );
        };

        ReactDOM.render(<JulienRefapChatbot />, document.getElementById('root'));
    </script>
</body>
</html>
