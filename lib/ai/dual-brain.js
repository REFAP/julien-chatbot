// lib/ai/dual-brain.js
// Orchestrateur Dual Brain - Fusion Claude + OpenAI + Lead Generation Business

import ClaudeClient from './claude.js';
import OpenAIClient from './openai.js';
import LeadGenerationSystem from '../utils/leads.js';
import { config, validateConfig } from '../utils/config.js';

export class DualBrainOrchestrator {
  constructor() {
    // Validation de la configuration
    if (!validateConfig()) {
      console.warn('⚠️ Configuration incomplète - Mode dégradé activé');
    }
    
    // Initialisation des clients IA
    this.claudeClient = new ClaudeClient();
    this.openaiClient = new OpenAIClient();
    this.leadSystem = new LeadGenerationSystem();
    
    // Statistiques business
    this.stats = {
      totalQueries: 0,
      premiumUpgrades: 0,
      leadsGenerated: 0,
      revenue: 0,
      conversionRate: 0
    };
    
    console.log('🚀 Dual Brain System initialisé - Mode Business activé');
  }

  // 🎯 POINT D'ENTRÉE PRINCIPAL - Traitement intelligent des requêtes
  async processQuery(userQuery, context = {}) {
    const startTime = Date.now();
    const sessionId = context.sessionId || this.generateSessionId();
    
    try {
      this.stats.totalQueries++;
      console.log(`🧠 Dual Brain: Query #${this.stats.totalQueries} - "${userQuery.substring(0, 50)}..."`);
      
      // 1. ANALYSE PRÉLIMINAIRE - Détection d'opportunité business
      const opportunity = this.leadSystem.analyzeOpportunity(
        userQuery, 
        userQuery, 
        { content: '', metadata: { confidence: 0.5 } }
      );
      
      console.log(`📊 Opportunité détectée: ${opportunity.confidence.toFixed(2)} (seuil: ${config.leadGeneration.qualityThreshold})`);
      
      // 2. STRATÉGIE DE RÉPONSE - Standard vs Premium
      const isPremiumUser = context.premiumToken && this.leadSystem.validatePremiumToken(context.premiumToken);
      const shouldOfferUpgrade = !isPremiumUser && opportunity.shouldTriggerUpgrade;
      
      if (shouldOfferUpgrade) {
        // 🎯 PARCOURS CONVERSION - Utilisateur standard avec opportunité
        return await this.handleConversionOpportunity(userQuery, opportunity, context, sessionId);
      } else if (isPremiumUser) {
        // 💎 PARCOURS PREMIUM - Utilisateur premium, expérience complète
        return await this.handlePremiumQuery(userQuery, context, sessionId);
      } else {
        // 📱 PARCOURS STANDARD - Réponse simple mais qualitative
        return await this.handleStandardQuery(userQuery, context, sessionId);
      }
      
    } catch (error) {
      console.error('💥 Erreur Dual Brain:', error);
      return this.handleCriticalError(error, userQuery, sessionId);
    }
  }

  // 🎯 GESTION OPPORTUNITÉ DE CONVERSION
  async handleConversionOpportunity(userQuery, opportunity, context, sessionId) {
    console.log('🎯 Mode Conversion: Opportunité détectée, préparation upgrade...');
    
    // Appel parallèle aux 2 IA pour une réponse de qualité
    const { claudeResponse, openaiResponse } = await this.callBothAIs(userQuery, {
      ...context,
      optimizeForConversion: true
    });
    
    // Fusion pour créer une réponse premium preview
    const previewResponse = await this.lightweightMerge(claudeResponse, openaiResponse, userQuery);
    
    // Génération du message d'upgrade personnalisé
    const upgradeOffer = this.leadSystem.generateUpgradeMessage(opportunity);
    
    // Réponse hybride : qualité + proposition premium
    return {
      content: previewResponse.content,
      strategy: 'conversion_opportunity',
      premiumOffer: {
        show: true,
        message: upgradeOffer.message,
        estimatedValue: upgradeOffer.estimatedValue,
        requiredFields: upgradeOffer.requiredFields
      },
      metadata: {
        ...previewResponse.metadata,
        conversionMode: true,
        opportunity,
        sessionId,
        callToAction: 'upgrade_to_premium'
      }
    };
  }

  // 💎 GESTION REQUÊTE PREMIUM
  async handlePremiumQuery(userQuery, context, sessionId) {
    console.log('💎 Mode Premium: Expérience complète Dual Brain activée');
    
    // Appels parallèles avec optimisation premium
    const { claudeResponse, openaiResponse } = await this.callBothAIs(userQuery, {
      ...context,
      premiumAccess: true,
      enhancedAnalysis: true
    });
    
    // Fusion intelligente complète
    const premiumResponse = await this.intelligentMerge(claudeResponse, openaiResponse, userQuery);
    
    // Enrichissement avec contexte premium
    return {
      ...premiumResponse,
      strategy: 'premium_dual_brain',
      premiumFeatures: {
        dualBrainActive: true,
        enhancedAccuracy: premiumResponse.metadata.confidence > 0.8,
        exclusiveInsights: true
      },
      metadata: {
        ...premiumResponse.metadata,
        premiumMode: true,
        sessionId,
        accessLevel: 'premium'
      }
    };
  }

  // 📱 GESTION REQUÊTE STANDARD
  async handleStandardQuery(userQuery, context, sessionId) {
    console.log('📱 Mode Standard: Réponse optimisée single-AI');
    
    // Choix intelligent de l'IA selon le type de question
    const bestAI = this.selectOptimalAI(userQuery);
    
    let response;
    if (bestAI === 'claude') {
      response = await this.claudeClient.generateResponse(userQuery, context);
    } else {
      response = await this.openaiClient.generateResponse(userQuery, context);
    }
    
    return {
      content: response.content,
      strategy: 'standard_single_ai',
      aiUsed: bestAI,
      metadata: {
        ...response.metadata,
        standardMode: true,
        sessionId,
        singleAI: bestAI
      }
    };
  }

  // 🔄 APPELS PARALLÈLES AUX DEUX IA
  async callBothAIs(userQuery, context = {}) {
    console.log('🔄 Appels parallèles: Claude + OpenAI...');
    
    // Préparation des contextes optimisés
    const claudeContext = { ...context, ai: 'claude' };
    const openaiContext = { ...context, ai: 'openai' };
    
    // Appels simultanés avec timeout
    const responses = await Promise.allSettled([
      this.timedCall(() => this.claudeClient.generateResponse(userQuery, claudeContext), 'Claude'),
      this.timedCall(() => this.openaiClient.generateResponse(userQuery, openaiContext), 'OpenAI')
    ]);
    
    // Gestion des résultats
    const claudeResult = responses[0];
    const openaiResult = responses[1];
    
    return {
      claudeResponse: claudeResult.status === 'fulfilled' ? claudeResult.value : this.createFallbackResponse('Claude', claudeResult.reason),
      openaiResponse: openaiResult.status === 'fulfilled' ? openaiResult.value : this.createFallbackResponse('OpenAI', openaiResult.reason)
    };
  }

  // ⏱️ Appel avec timeout et monitoring
  async timedCall(apiCall, aiName) {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        apiCall(),
        this.timeoutPromise(config.mergeStrategy.timeout)
      ]);
      
      const endTime = Date.now();
      console.log(`⚡ ${aiName}: ${endTime - startTime}ms`);
      
      return result;
      
    } catch (error) {
      console.error(`💥 ${aiName} Error:`, error.message);
      throw error;
    }
  }

  // ⏰ Promise de timeout
  timeoutPromise(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout après ${ms}ms`)), ms);
    });
  }

  // 🧠 FUSION INTELLIGENTE COMPLÈTE (Mode Premium)
  async intelligentMerge(claudeResponse, openaiResponse, userQuery) {
    console.log('🧠 Fusion intelligente: Analyse des forces...');
    
    // Analyse des forces de chaque réponse
    const claudeStrengths = this.analyzeResponseStrengths(claudeResponse, 'claude');
    const openaiStrengths = this.analyzeResponseStrengths(openaiResponse, 'openai');
    
    // Sélection de la stratégie de fusion optimale
    const fusionStrategy = this.selectFusionStrategy(claudeStrengths, openaiStrengths);
    
    let mergedContent;
    let confidence;
    
    switch (fusionStrategy) {
      case 'claude_lead':
        mergedContent = this.claudeLeadFusion(claudeResponse, openaiResponse);
        confidence = Math.max(claudeStrengths.overallScore, 0.8);
        break;
        
      case 'openai_lead':
        mergedContent = this.openaiLeadFusion(openaiResponse, claudeResponse);
        confidence = Math.max(openaiStrengths.overallScore, 0.8);
        break;
        
      case 'balanced_merge':
        mergedContent = this.balancedMerge(claudeResponse, openaiResponse);
        confidence = (claudeStrengths.overallScore + openaiStrengths.overallScore) / 2;
        break;
        
      case 'best_of_both':
        mergedContent = this.bestOfBothFusion(claudeResponse, openaiResponse, claudeStrengths, openaiStrengths);
        confidence = Math.max(claudeStrengths.overallScore, openaiStrengths.overallScore);
        break;
        
      default:
        mergedContent = claudeResponse.content; // Fallback
        confidence = claudeStrengths.overallScore;
    }
    
    console.log(`✨ Fusion complète: Stratégie ${fusionStrategy} (Confiance: ${confidence.toFixed(2)})`);
    
    return {
      content: mergedContent,
      strategy: 'intelligent_merge',
      fusionStrategy,
      metadata: {
        confidence,
        claudeScore: claudeStrengths.overallScore,
        openaiScore: openaiStrengths.overallScore,
        source: 'dual_brain_premium',
        enhancedQuality: true
      }
    };
  }

  // ⚡ FUSION LÉGÈRE (Mode Conversion)
  async lightweightMerge(claudeResponse, openaiResponse, userQuery) {
    console.log('⚡ Fusion légère: Preview premium...');
    
    // Sélection rapide du meilleur contenu
    const claudeScore = claudeResponse.metadata?.qualityScore || 0.7;
    const openaiScore = openaiResponse.metadata?.engagementScore || 0.7;
    
    let baseContent;
    let confidence;
    
    if (claudeScore > openaiScore + 0.1) {
      // Claude domine, on l'enrichit avec le ton d'OpenAI
      baseContent = this.enrichWithTone(claudeResponse.content, openaiResponse.content);
      confidence = claudeScore;
    } else if (openaiScore > claudeScore + 0.1) {
      // OpenAI domine, on l'enrichit avec la précision de Claude
      baseContent = this.enrichWithPrecision(openaiResponse.content, claudeResponse.content);
      confidence = openaiScore;
    } else {
      // Équilibré, fusion simple
      baseContent = this.simpleMerge(claudeResponse.content, openaiResponse.content);
      confidence = (claudeScore + openaiScore) / 2;
    }
    
    return {
      content: baseContent,
      strategy: 'lightweight_merge',
      metadata: {
        confidence,
        source: 'dual_brain_preview'
      }
    };
  }

  // 🎯 SÉLECTION DE LA STRATÉGIE DE FUSION
  selectFusionStrategy(claudeStrengths, openaiStrengths) {
    const claudeScore = claudeStrengths.overallScore;
    const openaiScore = openaiStrengths.overallScore;
    const scoreDiff = Math.abs(claudeScore - openaiScore);
    
    // Si un IA domine largement
    if (scoreDiff > 0.3) {
      return claudeScore > openaiScore ? 'claude_lead' : 'openai_lead';
    }
    
    // Si les scores sont proches
    if (scoreDiff < 0.1) {
      return 'best_of_both'; // Prendre le meilleur de chaque
    }
    
    // Cas intermédiaire
    return 'balanced_merge';
  }

  // 🧠 FUSION AVEC CLAUDE EN LEADER
  claudeLeadFusion(claudeResponse, openaiResponse) {
    const claudeContent = claudeResponse.content;
    const openaiTone = this.extractTone(openaiResponse.content);
    
    // Structure de Claude + amélioration du ton avec OpenAI
    return this.applyToneEnhancement(claudeContent, openaiTone);
  }

  // 🎨 FUSION AVEC OPENAI EN LEADER
  openaiLeadFusion(openaiResponse, claudeResponse) {
    const openaiContent = openaiResponse.content;
    const claudeFacts = this.extractFactualElements(claudeResponse.content);
    
    // Créativité d'OpenAI + validation factuelle de Claude
    return this.applyFactualEnhancement(openaiContent, claudeFacts);
  }

  // ⚖️ FUSION ÉQUILIBRÉE
  balancedMerge(claudeResponse, openaiResponse) {
    const claudeSentences = this.splitIntoSentences(claudeResponse.content);
    const openaiSentences = this.splitIntoSentences(openaiResponse.content);
    
    // Alternance intelligente entre les deux
    return this.interleaveSentences(claudeSentences, openaiSentences);
  }

  // 🏆 FUSION "MEILLEUR DES DEUX"
  bestOfBothFusion(claudeResponse, openaiResponse, claudeStrengths, openaiStrengths) {
    // Introduction engageante (force d'OpenAI)
    const intro = this.extractIntroduction(openaiResponse.content);
    
    // Corps principal structuré (force de Claude)
    const body = this.extractMainContent(claudeResponse.content);
    
    // Conclusion motivante (force d'OpenAI)
    const conclusion = this.extractConclusion(openaiResponse.content);
    
    return `${intro}\n\n${body}\n\n${conclusion}`.trim();
  }

  // 🔍 ANALYSE DES FORCES D'UNE RÉPONSE
  analyzeResponseStrengths(response, aiType) {
    if (!response.success) {
      return { overallScore: 0, strengths: [] };
    }
    
    if (aiType === 'claude') {
      return {
        overallScore: response.metadata?.qualityScore || 0.7,
        strengths: ['precision', 'structure', 'factual'],
        weaknesses: ['engagement'],
        recommendedFor: 'technical_content'
      };
    } else {
      return {
        overallScore: response.metadata?.engagementScore || 0.7,
        strengths: ['creativity', 'engagement', 'tone'],
        weaknesses: ['precision'],
        recommendedFor: 'conversational_content'
      };
    }
  }

  // 🤖 SÉLECTION DE L'IA OPTIMALE (Mode Standard)
  selectOptimalAI(userQuery) {
    const queryLower = userQuery.toLowerCase();
    
    // Critères pour Claude (précision, analyse)
    const claudeIndicators = [
      'expliquer', 'analyser', 'comment', 'pourquoi', 'définition',
      'technique', 'mécanisme', 'processus', 'diagnostic'
    ];
    
    // Critères pour OpenAI (créativité, conversation)
    const openaiIndicators = [
      'créer', 'imaginer', 'opinion', 'que penses-tu', 'conseil',
      'idée', 'suggestion', 'créatif', 'original'
    ];
    
    const claudeScore = claudeIndicators.filter(ind => queryLower.includes(ind)).length;
    const openaiScore = openaiIndicators.filter(ind => queryLower.includes(ind)).length;
    
    // Auto = Claude par défaut (plus technique)
    if (queryLower.includes('auto') || queryLower.includes('voiture')) {
      return 'claude';
    }
    
    return claudeScore > openaiScore ? 'claude' : 'openai';
  }

  // 📊 COLLECTE DE DONNÉES UTILISATEUR (Conversion)
  async collectUserData(userData, conversationContext) {
    try {
      console.log('📊 Collecte données utilisateur pour upgrade premium...');
      
      const result = await this.leadSystem.collectUserData(userData, conversationContext);
      
      if (result.success) {
        this.stats.premiumUpgrades++;
        this.stats.leadsGenerated++;
        this.stats.conversionRate = (this.stats.premiumUpgrades / this.stats.totalQueries * 100);
        
        console.log(`💎 Nouveau utilisateur premium! Lead #${this.stats.leadsGenerated}`);
        console.log(`📈 Taux de conversion: ${this.stats.conversionRate.toFixed(1)}%`);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Erreur collecte données:', error);
      return { success: false, error: error.message };
    }
  }

  // 📈 ANALYTICS ET STATISTIQUES BUSINESS
  async getBusinessAnalytics() {
    const leadAnalytics = await this.leadSystem.getAnalytics();
    
    return {
      system: {
        ...this.stats,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      leads: leadAnalytics,
      ai_performance: {
        claude: this.claudeClient.getClientStats(),
        openai: this.openaiClient.getClientStats()
      },
      revenue_projection: {
        monthly: leadAnalytics.total_estimated_value || 0,
        per_lead_average: leadAnalytics.total_estimated_value / Math.max(leadAnalytics.total_leads, 1) || 0
      }
    };
  }

  // 🆔 Génération d'ID de session
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  }

  // 🔧 UTILITAIRES DE FUSION

  // Extraction de ton d'une réponse
  extractTone(content) {
    // Extraction des éléments de style et ton
    return {
      enthusiasm: /excellent|formidable|génial/i.test(content),
      empathy: /comprends|normal|rassurant/i.test(content),
      professionalism: /recommande|conseille|expert/i.test(content)
    };
  }

  // Extraction d'éléments factuels
  extractFactualElements(content) {
    const sentences = content.split(/[.!?]+/);
    return sentences.filter(sentence => 
      /\d+|selon|basé sur|études/i.test(sentence)
    );
  }

  // Division en phrases
  splitIntoSentences(content) {
    return content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  }

  // Application d'amélioration de ton
  applyToneEnhancement(content, tone) {
    // Logique simplifiée d'amélioration du ton
    if (tone.enthusiasm && !content.includes('!')) {
      content = content.replace(/\.$/, ' !');
    }
    return content;
  }

  // Application d'amélioration factuelle
  applyFactualEnhancement(content, facts) {
    if (facts.length > 0 && content.length < 500) {
      return content + '\n\nÀ noter : ' + facts[0];
    }
    return content;
  }

  // Fusion simple de contenus
  simpleMerge(content1, content2) {
    const sentences1 = this.splitIntoSentences(content1);
    const sentences2 = this.splitIntoSentences(content2);
    
    // Prendre les meilleures phrases de chaque
    const merged = [];
    merged.push(sentences1[0] || ''); // Intro
    merged.push(...sentences1.slice(1)); // Corps
    if (sentences2.length > 0 && sentences2[sentences2.length - 1].length > 50) {
      merged.push(sentences2[sentences2.length - 1]); // Conclusion
    }
    
    return merged.filter(s => s.trim()).join(' ').trim();
  }

  // Extraction d'introduction
  extractIntroduction(content) {
    const sentences = this.splitIntoSentences(content);
    return sentences[0] || '';
  }

  // Extraction du contenu principal
  extractMainContent(content) {
    const sentences = this.splitIntoSentences(content);
    return sentences.slice(1, -1).join(' ');
  }

  // Extraction de conclusion
  extractConclusion(content) {
    const sentences = this.splitIntoSentences(content);
    return sentences[sentences.length - 1] || '';
  }

  // Enrichissement avec ton
  enrichWithTone(baseContent, toneSource) {
    // Logique simplifiée
    return baseContent;
  }

  // Enrichissement avec précision
  enrichWithPrecision(baseContent, precisionSource) {
    // Logique simplifiée
    return baseContent;
  }

  // Entrelacement de phrases
  interleaveSentences(sentences1, sentences2) {
    const result = [];
    const maxLength = Math.max(sentences1.length, sentences2.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (sentences1[i]) result.push(sentences1[i]);
      if (sentences2[i]) result.push(sentences2[i]);
    }
    
    return result.join(' ').trim();
  }

  // Création de réponse de fallback
  createFallbackResponse(aiName, error) {
    return {
      success: false,
      content: '',
      metadata: {
        source: aiName.toLowerCase(),
        error: error?.message || 'Erreur inconnue',
        fallback: true
      }
    };
  }

  // Gestion d'erreur critique
  handleCriticalError(error, originalQuery, sessionId) {
    console.error('🚨 Erreur critique Dual Brain:', error);
    
    return {
      content: `Je rencontre temporairement des difficultés techniques. Pouvez-vous reformuler votre question "${originalQuery.substring(0, 30)}..." ?`,
      strategy: 'error_fallback',
      metadata: {
        error: true,
        errorMessage: error.message,
        sessionId,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export default DualBrainOrchestrator;
