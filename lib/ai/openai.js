// lib/ai/openai.js
// Interface OpenAI optimisée pour engagement, créativité et conversion leads

import OpenAI from 'openai';
import { config } from '../utils/config.js';

export class OpenAIClient {
  constructor() {
    if (!config.apis.openai.apiKey) {
      throw new Error('OPENAI_API_KEY manquante dans les variables d\'environnement');
    }
    
    this.client = new OpenAI({
      apiKey: config.apis.openai.apiKey,
    });
    
    this.requestCount = 0;
    this.errorCount = 0;
  }

  // 🎨 GÉNÉRATION DE RÉPONSE ENGAGEANTE
  async generateResponse(prompt, context = {}) {
    const startTime = Date.now();
    this.requestCount++;

    try {
      // Optimisation du prompt pour maximiser l'engagement et la conversion
      const optimizedPrompt = this.optimizePromptForEngagement(prompt, context);
      
      console.log(`🟢 OpenAI: Traitement "${prompt.substring(0, 50)}..."`);

      const response = await this.client.chat.completions.create({
        model: config.apis.openai.model,
        max_tokens: config.apis.openai.maxTokens,
        temperature: config.apis.openai.temperature,
        messages: [
          {
            role: 'user',
            content: optimizedPrompt
          }
        ]
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Analyse de l'engagement et du potentiel de conversion
      const engagementMetrics = this.analyzeEngagementPotential(response.choices[0].message.content, prompt, context);

      const result = {
        success: true,
        content: response.choices[0].message.content,
        metadata: {
          model: config.apis.openai.model,
          responseTime,
          tokensUsed: response.usage?.total_tokens || 0,
          source: 'openai',
          engagementScore: engagementMetrics.overallScore,
          conversionPotential: engagementMetrics.conversionPotential,
          emotionalTone: engagementMetrics.emotionalTone,
          timestamp: new Date().toISOString()
        }
      };

      console.log(`✅ OpenAI: ${responseTime}ms (Engagement: ${engagementMetrics.overallScore.toFixed(2)})`);
      
      return result;

    } catch (error) {
      this.errorCount++;
      console.error('❌ Erreur OpenAI API:', error.message);
      
      return {
        success: false,
        content: '',
        error: error.message,
        metadata: {
          source: 'openai',
          responseTime: Date.now() - startTime,
          errorType: this.categorizeError(error)
        }
      };
    }
  }

  // 🚀 OPTIMISATION POUR ENGAGEMENT ET CONVERSION
  optimizePromptForEngagement(originalPrompt, context) {
    let optimizedPrompt = originalPrompt;
    
    const isPremiumUser = context.premiumAccess || false;
    const userEngagementLevel = this.assessUserEngagement(context);
    const autoTopicDetected = this.detectAutoTopic(originalPrompt);
    
    // 🎯 Pour les utilisateurs standards avec sujet auto - on optimise pour la conversion
    if (!isPremiumUser && autoTopicDetected && userEngagementLevel > 0.6) {
      optimizedPrompt = `Répondez à cette question automobile de manière engageante et utile, en adoptant un ton expert mais accessible :

QUESTION: ${originalPrompt}

Structurez votre réponse pour :
- Donner une réponse immédiatement utile
- Adopter un ton chaleureux et professionnel
- Inclure des conseils pratiques
- Mentionner l'importance de la sécurité quand pertinent
- Être suffisamment détaillé pour être crédible

Réponse experte et engageante:`;
    }
    
    // 🔥 Pour les utilisateurs premium - on mise sur l'excellence créative
    else if (isPremiumUser) {
      optimizedPrompt = `En tant qu'expert premium avec accès à notre IA double-puissance, répondez avec excellence à cette question :

${originalPrompt}

Fournissez une réponse :
- Créative et personnalisée
- Avec des exemples concrets et analogies parlantes
- Incluant des tips d'expert peu connus
- Adoptant un ton premium et confidentiel
- Proposant des perspectives originales

Réponse premium exclusive:`;
    }
    
    // 💬 Pour les questions générales - on mise sur la conversation naturelle
    else if (this.isConversationalQuery(originalPrompt)) {
      optimizedPrompt = `Répondez de manière naturelle et engageante à cette question, comme un expert passionné qui aime partager ses connaissances :

${originalPrompt}

Adoptez un style :
- Conversationnel et accessible
- Avec de l'enthousiasme approprié
- Incluant des anecdotes ou exemples si pertinent
- Encourageant la curiosité
- Invitant à poser d'autres questions`;
    }
    
    // 🎨 Pour les questions créatives - on libère la créativité
    else if (this.isCreativeQuery(originalPrompt)) {
      optimizedPrompt = `Soyez créatif et inspirant dans votre réponse à cette demande :

${originalPrompt}

Laissez libre cours à votre créativité tout en restant pertinent et utile. Surprenez positivement !`;
    }

    return optimizedPrompt;
  }

  // 🚗 Détection de sujets automobiles (opportunités de leads)
  detectAutoTopic(prompt) {
    const autoKeywords = [
      'voiture', 'auto', 'véhicule', 'moteur', 'garage', 'mécanique',
      'pneu', 'frein', 'vidange', 'révision', 'entretien', 'réparation',
      'carrosserie', 'panne', 'diagnostic', 'assurance auto', 'permis',
      'achat auto', 'vente voiture', 'occasion', 'neuf', 'concessionnaire'
    ];
    
    const lowerPrompt = prompt.toLowerCase();
    const foundKeywords = autoKeywords.filter(keyword => lowerPrompt.includes(keyword));
    
    return {
      isAutoTopic: foundKeywords.length > 0,
      keywords: foundKeywords,
      confidence: Math.min(foundKeywords.length * 0.3, 1.0)
    };
  }

  // 📊 ANALYSE DU POTENTIEL D'ENGAGEMENT
  analyzeEngagementPotential(responseContent, originalPrompt, context) {
    const metrics = {
      creativity: this.assessCreativity(responseContent),
      conversationalTone: this.assessConversationalTone(responseContent),
      emotionalConnection: this.assessEmotionalConnection(responseContent),
      actionability: this.assessActionability(responseContent),
      conversionPotential: this.assessConversionPotential(responseContent, originalPrompt)
    };

    // Score global pondéré selon les forces d'OpenAI
    const openaiWeights = {
      creativity: 0.3,           // Force principale d'OpenAI
      conversationalTone: 0.25,  // Excellent en conversation
      emotionalConnection: 0.2,  // Bon en émotion
      actionability: 0.15,       // Call-to-actions
      conversionPotential: 0.1   // Potentiel business
    };

    const overallScore = Object.entries(metrics).reduce((total, [key, score]) => {
      return total + (score * openaiWeights[key]);
    }, 0);

    return {
      ...metrics,
      overallScore,
      emotionalTone: this.detectEmotionalTone(responseContent),
      callToActionStrength: this.assessCallToActionStrength(responseContent),
      recommendedUse: this.getRecommendedUse(metrics)
    };
  }

  // 🎨 Évaluation de la créativité (force d'OpenAI)
  assessCreativity(content) {
    let score = 0.6; // Score de base pour OpenAI
    
    // Variété du vocabulaire
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    const vocabularyRichness = uniqueWords.size / Math.max(words.length, 1);
    score += Math.min(vocabularyRichness * 0.5, 0.2);
    
    // Métaphores et analogies
    const creativeExpressions = [
      /comme|tel que|à l'image de|semblable à/i,
      /imaginez|visualisez|pensez à/i,
      /c'est un peu comme|on pourrait dire que/i
    ];
    
    creativeExpressions.forEach(expr => {
      if (expr.test(content)) score += 0.05;
    });
    
    // Exemples originaux
    if (/par exemple.*original|anecdote|histoire/i.test(content)) {
      score += 0.1;
    }
    
    // Tournures expressives
    if (/vraiment|absolument|particulièrement|spécialement/i.test(content)) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  // 💬 Évaluation du ton conversationnel
  assessConversationalTone(content) {
    let score = 0.5;
    
    // Utilisation du "vous" et questions
    if (/vous|votre|vos/.test(content)) score += 0.1;
    if (/\?/.test(content)) score += 0.1;
    
    // Expressions conversationnelles
    const conversationalPhrases = [
      /n'est-ce pas|pas vrai|vous savez|voyez-vous/i,
      /d'ailleurs|au fait|entre nous|franchement/i,
      /eh bien|bon|alors|donc/i
    ];
    
    conversationalPhrases.forEach(phrase => {
      if (phrase.test(content)) score += 0.08;
    });
    
    // Tons d'enthousiasme modéré
    if (/excellent|formidable|génial|super|parfait/i.test(content)) {
      score += 0.1;
    }
    
    // Encouragements
    if (/n'hésitez pas|feel free|allez-y|courage/i.test(content)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  // ❤️ Évaluation de la connexion émotionnelle
  assessEmotionalConnection(content) {
    let score = 0.4;
    
    // Empathie et compréhension
    const empathyIndicators = [
      /je comprends|c'est compréhensible|c'est normal/i,
      /rassurant|rassurer|pas de panique|ne vous inquiétez pas/i,
      /situation délicate|c'est embêtant|je comprends votre frustration/i
    ];
    
    empathyIndicators.forEach(indicator => {
      if (indicator.test(content)) score += 0.1;
    });
    
    // Personnalisation
    if (/dans votre cas|pour vous|selon votre situation/i.test(content)) {
      score += 0.15;
    }
    
    // Encouragement positif
    if (/vous allez y arriver|c'est possible|bonne nouvelle/i.test(content)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  // 🎯 Évaluation de l'actionabilité (conversion)
  assessActionability(content) {
    let score = 0.3;
    
    // Conseils pratiques
    const actionableIndicators = [
      /je recommande|je conseille|je suggère/i,
      /voici comment|suivez ces étapes|procédez ainsi/i,
      /commencez par|d'abord|ensuite|enfin/i
    ];
    
    actionableIndicators.forEach(indicator => {
      if (indicator.test(content)) score += 0.1;
    });
    
    // Instructions claires
    if (/\d+\.|^-|^\*|premièrement|deuxièmement/m.test(content)) {
      score += 0.15;
    }
    
    // Call-to-actions subtils
    if (/n'hésitez pas à|pensez à|vérifiez|contrôlez/i.test(content)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  // 💰 Évaluation du potentiel de conversion
  assessConversionPotential(responseContent, originalPrompt) {
    let score = 0.2;
    
    // Mention de services professionnels (leads potentiels)
    const serviceKeywords = [
      'professionnel', 'expert', 'spécialiste', 'garage', 'mécanicien',
      'diagnostic', 'vérification', 'contrôle', 'entretien', 'réparation'
    ];
    
    const contentLower = responseContent.toLowerCase();
    const foundServices = serviceKeywords.filter(keyword => contentLower.includes(keyword));
    score += Math.min(foundServices.length * 0.1, 0.3);
    
    // Urgence ou importance
    if (/urgent|important|essentiel|nécessaire|obligatoire/i.test(responseContent)) {
      score += 0.2;
    }
    
    // Mention de coûts/budget (intérêt commercial)
    if (/coût|prix|budget|cher|économique|gratuit/i.test(responseContent)) {
      score += 0.15;
    }
    
    // Questions de suivi (engagement)
    if (/avez-vous|souhaitez-vous|voulez-vous|autres questions/i.test(responseContent)) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  // 😊 Détection du ton émotionnel
  detectEmotionalTone(content) {
    const toneIndicators = {
      enthusiastic: /excellent|formidable|génial|super|fantastique/i.test(content),
      reassuring: /rassurant|pas de panique|ne vous inquiétez pas|normal/i.test(content),
      professional: /recommande|conseille|expertise|professionnel/i.test(content),
      friendly: /n'hésitez pas|volontiers|plaisir|sympa/i.test(content),
      urgent: /urgent|rapidement|vite|immédiatement/i.test(content)
    };
    
    // Retourne le ton dominant
    const dominantTone = Object.entries(toneIndicators)
      .filter(([_, present]) => present)
      .map(([tone, _]) => tone);
    
    return dominantTone.length > 0 ? dominantTone[0] : 'neutral';
  }

  // 📢 Évaluation de la force des call-to-actions
  assessCallToActionStrength(content) {
    const strongCTA = [
      /n'hésitez pas à me poser|autres questions|puis-je vous aider/i,
      /contactez|appelez|rendez-vous|prenez contact/i,
      /je peux vous en dire plus|souhaitez-vous que je/i
    ];
    
    const foundCTAs = strongCTA.filter(cta => cta.test(content));
    return Math.min(foundCTAs.length * 0.3, 1.0);
  }

  // 🎯 Recommandation d'usage pour la fusion Dual Brain
  getRecommendedUse(metrics) {
    if (metrics.conversationalTone > 0.8 && metrics.creativity > 0.7) {
      return 'lead_response'; // Utiliser comme réponse principale
    } else if (metrics.emotionalConnection > 0.7) {
      return 'engagement_layer'; // Utiliser pour l'engagement
    } else if (metrics.creativity > 0.8) {
      return 'creative_enhancement'; // Utiliser pour enrichir créativement
    } else if (metrics.conversionPotential > 0.6) {
      return 'conversion_optimizer'; // Utiliser pour la conversion
    } else {
      return 'tone_enhancement'; // Utiliser pour améliorer le ton
    }
  }

  // 🔍 Évaluation de l'engagement utilisateur selon le contexte
  assessUserEngagement(context) {
    let engagementScore = 0.5; // Base
    
    // Longueur de la question (plus c'est long, plus l'user est engagé)
    if (context.queryLength > 50) engagementScore += 0.2;
    if (context.queryLength > 100) engagementScore += 0.1;
    
    // Questions de suivi (conversation existante)
    if (context.isFollowUp) engagementScore += 0.2;
    
    // Mentions de problèmes spécifiques (engagement émotionnel)
    if (context.hasProblemMention) engagementScore += 0.1;
    
    return Math.min(engagementScore, 1.0);
  }

  // 💬 Détection de questions conversationnelles
  isConversationalQuery(prompt) {
    const conversationalIndicators = /que penses-tu|ton avis|qu'est-ce que tu|comment ça va/i;
    return conversationalIndicators.test(prompt);
  }

  // 🎨 Détection de questions créatives
  isCreativeQuery(prompt) {
    const creativeIndicators = /créer|inventer|imaginer|idée|conception|design|innover/i;
    return creativeIndicators.test(prompt);
  }

  // 🚨 Catégorisation des erreurs
  categorizeError(error) {
    if (error.message?.includes('rate limit')) return 'rate_limit';
    if (error.message?.includes('insufficient_quota')) return 'quota_exceeded';
    if (error.message?.includes('invalid_api_key')) return 'auth_error';
    if (error.message?.includes('timeout')) return 'timeout';
    return 'unknown_error';
  }

  // 📊 STATISTIQUES ET MONITORING
  getClientStats() {
    return {
      requests_made: this.requestCount,
      errors_encountered: this.errorCount,
      success_rate: this.requestCount > 0 ? ((this.requestCount - this.errorCount) / this.requestCount * 100).toFixed(1) : 100,
      status: this.errorCount / Math.max(this.requestCount, 1) < 0.1 ? 'healthy' : 'degraded'
    };
  }

  // 🔧 Test de connectivité
  async testConnection() {
    try {
      const testResponse = await this.generateResponse('Test bref', { skipOptimization: true });
      return {
        status: testResponse.success ? 'connected' : 'error',
        latency: testResponse.metadata?.responseTime || 0,
        error: testResponse.error || null
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

export default OpenAIClient;
