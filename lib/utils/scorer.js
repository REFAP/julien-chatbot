// lib/utils/scorer.js
// Système de scoring avancé - Algorithmes secrets du Dual Brain

import { config } from './config.js';

export class AdvancedResponseScorer {
  constructor() {
    this.scoringHistory = new Map();
    this.learningData = {
      conversionPatterns: [],
      successfulMerges: [],
      optimalStrategies: new Map()
    };
  }

  // 🎯 ANALYSE COMPLÈTE D'UNE RÉPONSE IA
  analyzeResponse(response, originalQuery, context = {}) {
    const startTime = Date.now();
    
    const analysis = {
      // Métriques de base
      quality: this.assessQuality(response, originalQuery),
      relevance: this.assessRelevance(response, originalQuery),
      engagement: this.assessEngagement(response, context),
      businessValue: this.assessBusinessValue(response, originalQuery),
      
      // Métriques avancées spécifiques business
      conversionPotential: this.assessConversionPotential(response, originalQuery, context),
      leadQuality: this.assessLeadQuality(response, originalQuery),
      partnerMatch: this.assessPartnerMatch(response, originalQuery),
      urgencyDetection: this.detectUrgencyLevel(response, originalQuery),
      
      // Métriques techniques
      clarity: this.assessClarity(response),
      completeness: this.assessCompleteness(response, originalQuery),
      accuracy: this.assessAccuracy(response, originalQuery),
      creativity: this.assessCreativity(response),
      
      // Contexte utilisateur
      userSatisfactionPrediction: this.predictUserSatisfaction(response, context),
      retentionPotential: this.assessRetentionPotential(response, context)
    };

    // Score global intelligent avec pondération business
    const globalScore = this.calculateIntelligentScore(analysis, context);
    
    // Recommandations stratégiques
    const recommendations = this.generateStrategicRecommendations(analysis, context);
    
    const processingTime = Date.now() - startTime;
    
    return {
      ...analysis,
      globalScore,
      recommendations,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        version: '2.0'
      }
    };
  }

  // 🏆 ÉVALUATION DE LA QUALITÉ GLOBALE
  assessQuality(response, query) {
    let score = 0.4; // Base
    
    // Longueur optimale (ni trop court, ni trop long)
    const contentLength = response.content?.length || 0;
    if (contentLength > 100 && contentLength < 1500) {
      score += 0.2;
    } else if (contentLength > 1500 && contentLength < 2500) {
      score += 0.1; // Acceptable mais long
    }
    
    // Structure et organisation
    const structureScore = this.evaluateStructure(response.content);
    score += structureScore * 0.25;
    
    // Cohérence et logique
    const coherenceScore = this.evaluateCoherence(response.content);
    score += coherenceScore * 0.15;
    
    return Math.min(score, 1.0);
  }

  // 🎯 ÉVALUATION DE LA PERTINENCE
  assessRelevance(response, query) {
    const queryWords = this.extractKeywords(query);
    const responseWords = this.extractKeywords(response.content || '');
    
    // Intersection des mots-clés
    const commonKeywords = queryWords.filter(word => 
      responseWords.some(rWord => this.isSimilar(word, rWord))
    );
    
    let relevanceScore = commonKeywords.length / Math.max(queryWords.length, 1);
    
    // Bonus pour réponse directe aux questions
    if (this.answersDirectly(response.content, query)) {
      relevanceScore += 0.2;
    }
    
    // Bonus pour contexte automobile (business focus)
    if (this.containsAutoContext(response.content) && this.containsAutoContext(query)) {
      relevanceScore += 0.15;
    }
    
    return Math.min(relevanceScore, 1.0);
  }

  // 🔥 ÉVALUATION DE L'ENGAGEMENT
  assessEngagement(response, context) {
    let engagementScore = 0.3;
    
    const content = response.content || '';
    
    // Ton conversationnel
    const conversationalIndicators = [
      /vous|votre|vos/g,
      /\?/g,
      /n'est-ce pas|pas vrai|vous savez/gi,
      /je pense que|à mon avis|selon moi/gi
    ];
    
    conversationalIndicators.forEach(indicator => {
      const matches = content.match(indicator) || [];
      engagementScore += Math.min(matches.length * 0.05, 0.1);
    });
    
    // Appels à l'action
    const ctaIndicators = [
      /n'hésitez pas|contactez|appelez/gi,
      /souhaitez-vous|voulez-vous|aimeriez-vous/gi,
      /je peux vous aider|puis-je vous/gi
    ];
    
    ctaIndicators.forEach(indicator => {
      if (indicator.test(content)) {
        engagementScore += 0.1;
      }
    });
    
    // Personnalisation selon le contexte utilisateur
    if (context.premiumUser) {
      engagementScore += 0.1; // Standard plus élevé pour premium
    }
    
    // Émotion positive
    if (/excellent|formidable|parfait|super|génial/gi.test(content)) {
      engagementScore += 0.08;
    }
    
    return Math.min(engagementScore, 1.0);
  }

  // 💰 ÉVALUATION DE LA VALEUR BUSINESS
  assessBusinessValue(response, query) {
    let businessScore = 0.2;
    
    const content = (response.content || '').toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Détection de mots-clés business automobile
    const businessKeywords = {
      high_value: ['diagnostic', 'réparation', 'entretien', 'révision', 'garage'], // 0.15 each
      medium_value: ['pneu', 'frein', 'vidange', 'batterie', 'huile'], // 0.1 each
      conversion_words: ['coût', 'prix', 'budget', 'devis', 'facture'] // 0.12 each
    };
    
    Object.entries(businessKeywords).forEach(([category, keywords]) => {
      const found = keywords.filter(keyword => content.includes(keyword));
      const multiplier = category === 'high_value' ? 0.15 : category === 'medium_value' ? 0.1 : 0.12;
      businessScore += found.length * multiplier;
    });
    
    // Mention de professionnels (leads potentiels)
    const professionalMentions = [
      'mécanicien', 'garagiste', 'expert', 'spécialiste', 'professionnel'
    ];
    
    const profMentions = professionalMentions.filter(term => content.includes(term));
    businessScore += profMentions.length * 0.1;
    
    // Urgence commerciale
    if (/urgent|rapidement|immédiatement|vite/gi.test(content)) {
      businessScore += 0.15;
    }
    
    return Math.min(businessScore, 1.0);
  }

  // 🎯 POTENTIEL DE CONVERSION EN LEAD
  assessConversionPotential(response, query, context) {
    let conversionScore = 0.1;
    
    // Analyse du profil utilisateur
    const userEngagement = context.messageCount || 1;
    const sessionDuration = context.sessionDuration || 0;
    
    // Utilisateur engagé = meilleur potentiel
    if (userEngagement > 2) conversionScore += 0.2;
    if (sessionDuration > 300) conversionScore += 0.15; // Plus de 5 min
    
    // Analyse du contenu pour déclencheurs de conversion
    const content = response.content || '';
    
    // Questions ouvertes qui invitent à continuer
    if (/autres questions|puis-je vous aider|souhaitez-vous/gi.test(content)) {
      conversionScore += 0.2;
    }
    
    // Mention de services premium
    if (/expert|analyse approfondie|diagnostic complet/gi.test(content)) {
      conversionScore += 0.15;
    }
    
    // Complexité de la réponse (justifie un service premium)
    const complexity = this.assessComplexity(content);
    conversionScore += complexity * 0.2;
    
    // Context automobile + problème = forte conversion
    if (this.containsAutoContext(query) && this.containsProblem(query)) {
      conversionScore += 0.25;
    }
    
    return Math.min(conversionScore, 1.0);
  }

  // 🏅 QUALITÉ DU LEAD GÉNÉRÉ
  assessLeadQuality(response, query) {
    let leadScore = 0.2;
    
    // Détection du type de besoin
    const needType = this.detectNeedType(query + ' ' + (response.content || ''));
    
    if (needType.detected) {
      leadScore += 0.3;
      
      // Bonus selon la valeur du besoin
      const needValue = this.getNeedValue(needType.category);
      leadScore += needValue * 0.2;
    }
    
    // Urgence = lead plus qualifié
    const urgency = this.detectUrgencyLevel(response, query);
    leadScore += urgency.level * 0.2;
    
    // Mention de budget = lead commercial
    if (/budget|combien|prix|coût/gi.test(query)) {
      leadScore += 0.15;
    }
    
    // Localisation mentionnée = lead actionnable
    if (/ville|région|près de|autour de/gi.test(query)) {
      leadScore += 0.1;
    }
    
    return Math.min(leadScore, 1.0);
  }

  // 🤝 CORRESPONDANCE AVEC LES PARTENAIRES
  assessPartnerMatch(response, query) {
    const fullText = (query + ' ' + (response.content || '')).toLowerCase();
    
    let bestMatch = { partner: null, score: 0, specialties: [] };
    
    // Analyse pour chaque partenaire
    Object.entries(config.partners).forEach(([partnerKey, partnerConfig]) => {
      if (!partnerConfig.active) return;
      
      let matchScore = 0;
      const matchedSpecialties = [];
      
      partnerConfig.specialites.forEach(specialite => {
        if (fullText.includes(specialite)) {
          matchScore += 0.2;
          matchedSpecialties.push(specialite);
        }
      });
      
      // Bonus pour correspondance multiple
      if (matchedSpecialties.length > 1) {
        matchScore += 0.1;
      }
      
      if (matchScore > bestMatch.score) {
        bestMatch = {
          partner: partnerKey,
          score: matchScore,
          specialties: matchedSpecialties,
          estimatedValue: partnerConfig.leadValue
        };
      }
    });
    
    return bestMatch;
  }

  // ⚡ DÉTECTION DU NIVEAU D'URGENCE
  detectUrgencyLevel(response, query) {
    const fullText = (query + ' ' + (response.content || '')).toLowerCase();
    
    const urgencyLevels = {
      critical: {
        keywords: ['panne', 'ne démarre plus', 'accident', 'danger', 'sécurité'],
        multiplier: 1.0,
        level: 'critique'
      },
      high: {
        keywords: ['urgent', 'rapidement', 'aujourd\'hui', 'demain', 'vite'],
        multiplier: 0.8,
        level: 'élevé'
      },
      medium: {
        keywords: ['bientôt', 'cette semaine', 'prochainement', 'soon'],
        multiplier: 0.5,
        level: 'moyen'
      },
      low: {
        keywords: ['éventuellement', 'un jour', 'plus tard', 'futur'],
        multiplier: 0.2,
        level: 'faible'
      }
    };
    
    let detectedUrgency = { level: 0, category: 'aucune', keywords: [] };
    
    Object.entries(urgencyLevels).forEach(([category, config]) => {
      const foundKeywords = config.keywords.filter(keyword => fullText.includes(keyword));
      
      if (foundKeywords.length > 0) {
        const urgencyScore = config.multiplier * (foundKeywords.length / config.keywords.length);
        
        if (urgencyScore > detectedUrgency.level) {
          detectedUrgency = {
            level: urgencyScore,
            category: config.level,
            keywords: foundKeywords
          };
        }
      }
    });
    
    return detectedUrgency;
  }

  // 📊 SCORE GLOBAL INTELLIGENT
  calculateIntelligentScore(analysis, context) {
    // Pondération dynamique selon le contexte business
    const weights = this.calculateDynamicWeights(context);
    
    const components = {
      quality: analysis.quality,
      relevance: analysis.relevance,
      engagement: analysis.engagement,
      businessValue: analysis.businessValue,
      conversionPotential: analysis.conversionPotential,
      leadQuality: analysis.leadQuality
    };
    
    let globalScore = 0;
    Object.entries(components).forEach(([component, score]) => {
      const weight = weights[component] || 0.15;
      globalScore += score * weight;
    });
    
    // Bonus pour excellence dans un domaine
    const maxScore = Math.max(...Object.values(components));
    if (maxScore > 0.9) {
      globalScore += 0.05; // Bonus excellence
    }
    
    // Malus pour faiblesse critique
    const minScore = Math.min(...Object.values(components));
    if (minScore < 0.3) {
      globalScore -= 0.05; // Malus faiblesse
    }
    
    return Math.min(globalScore, 1.0);
  }

  // ⚖️ CALCUL DES POIDS DYNAMIQUES
  calculateDynamicWeights(context) {
    const baseWeights = {
      quality: 0.2,
      relevance: 0.2,
      engagement: 0.15,
      businessValue: 0.2,
      conversionPotential: 0.15,
      leadQuality: 0.1
    };
    
    // Ajustement selon le contexte
    if (context.premiumUser) {
      // Pour les users premium, on privilégie qualité et pertinence
      baseWeights.quality += 0.05;
      baseWeights.relevance += 0.05;
      baseWeights.conversionPotential -= 0.1;
    } else {
      // Pour les users standard, on privilégie conversion et business
      baseWeights.conversionPotential += 0.05;
      baseWeights.businessValue += 0.05;
      baseWeights.quality -= 0.05;
      baseWeights.engagement -= 0.05;
    }
    
    return baseWeights;
  }

  // 🎯 RECOMMANDATIONS STRATÉGIQUES
  generateStrategicRecommendations(analysis, context) {
    const recommendations = [];
    
    // Recommandations basées sur les scores
    if (analysis.conversionPotential > 0.7 && !context.premiumUser) {
      recommendations.push({
        type: 'conversion',
        action: 'trigger_premium_upgrade',
        confidence: analysis.conversionPotential,
        reason: 'Forte probabilité de conversion détectée'
      });
    }
    
    if (analysis.businessValue > 0.6) {
      const partnerMatch = analysis.partnerMatch;
      if (partnerMatch && partnerMatch.score > 0.4) {
        recommendations.push({
          type: 'lead_generation',
          action: 'prepare_lead_capture',
          partner: partnerMatch.partner,
          estimatedValue: partnerMatch.estimatedValue,
          reason: `Correspondance avec ${partnerMatch.partner}: ${partnerMatch.specialties.join(', ')}`
        });
      }
    }
    
    if (analysis.engagement < 0.4) {
      recommendations.push({
        type: 'engagement',
        action: 'improve_conversational_tone',
        priority: 'medium',
        reason: 'Score d\'engagement faible'
      });
    }
    
    if (analysis.urgencyDetection.level > 0.7) {
      recommendations.push({
        type: 'urgency',
        action: 'prioritize_response',
        urgencyLevel: analysis.urgencyDetection.category,
        reason: `Urgence ${analysis.urgencyDetection.category} détectée`
      });
    }
    
    return recommendations;
  }

  // 🔧 UTILITAIRES D'ÉVALUATION

  evaluateStructure(content) {
    if (!content) return 0;
    
    let structureScore = 0.3;
    
    // Paragraphes
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) structureScore += 0.2;
    
    // Listes ou énumérations
    if (/^\d+\.|^-|^\*|^•/m.test(content)) structureScore += 0.2;
    
    // Sous-titres
    if (/^[A-Z][^.!?]*:$/m.test(content)) structureScore += 0.15;
    
    // Conclusion
    if (/en conclusion|en résumé|pour résumer/gi.test(content)) structureScore += 0.15;
    
    return Math.min(structureScore, 1.0);
  }

  evaluateCoherence(content) {
    if (!content) return 0;
    
    let coherenceScore = 0.5;
    
    // Connecteurs logiques
    const connectors = /donc|ainsi|par conséquent|cependant|néanmoins|de plus/gi;
    const connectorMatches = content.match(connectors) || [];
    coherenceScore += Math.min(connectorMatches.length * 0.1, 0.3);
    
    // Cohérence thématique (répétition de mots-clés)
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq = {};
    words.forEach(word => wordFreq[word] = (wordFreq[word] || 0) + 1);
    
    const repeatedWords = Object.values(wordFreq).filter(freq => freq > 1).length;
    coherenceScore += Math.min(repeatedWords * 0.02, 0.2);
    
    return Math.min(coherenceScore, 1.0);
  }

  extractKeywords(text) {
    if (!text) return [];
    
    return text.toLowerCase()
      .match(/\b\w{4,}\b/g) || []
      .filter(word => !this.isStopWord(word));
  }

  isStopWord(word) {
    const stopWords = [
      'avec', 'dans', 'pour', 'être', 'avoir', 'faire', 'dire', 'aller',
      'voir', 'savoir', 'prendre', 'venir', 'falloir', 'devoir', 'autre',
      'grand', 'nouveau', 'premier', 'dernier', 'jeune', 'français', 'long'
    ];
    return stopWords.includes(word);
  }

  isSimilar(word1, word2) {
    return word1 === word2 || 
           word1.includes(word2) || 
           word2.includes(word1) ||
           this.levenshteinDistance(word1, word2) <= 2;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  answersDirectly(content, query) {
    const questionWords = ['qui', 'que', 'quoi', 'quand', 'où', 'comment', 'pourquoi', 'combien'];
    const hasQuestion = questionWords.some(word => query.toLowerCase().includes(word));
    
    if (!hasQuestion) return false;
    
    // Vérifie si la réponse commence par une réponse directe
    const directAnswers = /^(oui|non|c'est|il s'agit de|la réponse est)/i;
    return directAnswers.test(content);
  }

  containsAutoContext(text) {
    const autoKeywords = [
      'voiture', 'auto', 'véhicule', 'moteur', 'garage', 'mécanique',
      'pneu', 'frein', 'vidange', 'révision', 'entretien', 'réparation'
    ];
    
    const lowerText = text.toLowerCase();
    return autoKeywords.some(keyword => lowerText.includes(keyword));
  }

  containsProblem(text) {
    const problemKeywords = [
      'panne', 'problème', 'défaut', 'dysfonctionnement', 'erreur',
      'bruit', 'fuite', 'vibration', 'ne fonctionne pas', 'cassé'
    ];
    
    const lowerText = text.toLowerCase();
    return problemKeywords.some(keyword => lowerText.includes(keyword));
  }

  detectNeedType(text) {
    const needCategories = {
      maintenance: ['entretien', 'révision', 'vidange', 'contrôle'],
      repair: ['réparation', 'panne', 'diagnostic', 'dépannage'],
      parts: ['pièce', 'accessoire', 'équipement', 'remplacement'],
      purchase: ['achat', 'vente', 'occasion', 'neuf']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(needCategories)) {
      const found = keywords.filter(keyword => lowerText.includes(keyword));
      if (found.length > 0) {
        return { detected: true, category, keywords: found };
      }
    }
    
    return { detected: false };
  }

  getNeedValue(category) {
    const values = {
      maintenance: 0.6,
      repair: 0.8,
      parts: 0.4,
      purchase: 1.0
    };
    
    return values[category] || 0.3;
  }

  assessComplexity(content) {
    if (!content) return 0;
    
    let complexityScore = 0;
    
    // Longueur du contenu
    complexityScore += Math.min(content.length / 1000, 0.3);
    
    // Vocabulaire technique
    const technicalTerms = content.match(/\b[a-z]{8,}\b/gi) || [];
    complexityScore += Math.min(technicalTerms.length * 0.05, 0.3);
    
    // Structure complexe
    const sentences = content.split(/[.!?]+/).length;
    if (sentences > 5) complexityScore += 0.2;
    
    // Nuances et conditions
    if (/cependant|néanmoins|toutefois|selon|dépend/gi.test(content)) {
      complexityScore += 0.2;
    }
    
    return Math.min(complexityScore, 1.0);
  }

  assessClarity(response) {
    const content = response.content || '';
    let clarityScore = 0.5;
    
    // Phrases courtes et claires
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / Math.max(sentences.length, 1);
    
    if (avgSentenceLength < 120) clarityScore += 0.2;
    if (avgSentenceLength < 80) clarityScore += 0.1;
    
    // Éviter le jargon excessif
    const jargonWords = content.match(/\b[a-z]{12,}\b/gi) || [];
    if (jargonWords.length < 3) clarityScore += 0.1;
    
    // Explications claires
    if (/c'est-à-dire|autrement dit|en d'autres termes/gi.test(content)) {
      clarityScore += 0.1;
    }
    
    return Math.min(clarityScore, 1.0);
  }

  assessCompleteness(response, query) {
    const content = response.content || '';
    let completenessScore = 0.3;
    
    // Longueur appropriée
    if (content.length > 200) completenessScore += 0.2;
    if (content.length > 500) completenessScore += 0.1;
    
    // Aborde différents aspects
    const queryWords = this.extractKeywords(query);
    const responseWords = this.extractKeywords(content);
    const coverage = queryWords.filter(word => 
      responseWords.some(rWord => this.isSimilar(word, rWord))
    ).length;
    
    completenessScore += (coverage / Math.max(queryWords.length, 1)) * 0.3;
    
    // Exemples et détails
    if (/par exemple|comme|tel que/gi.test(content)) completenessScore += 0.1;
    if (/détail|précis|exact/gi.test(content)) completenessScore += 0.1;
    
    return Math.min(completenessScore, 1.0);
  }

  assessAccuracy(response, query) {
    const content = response.content || '';
    let accuracyScore = 0.6; // Base optimiste
    
    // Indicateurs de précision
    if (/selon|d'après|basé sur|études montrent/gi.test(content)) accuracyScore += 0.1;
    if (/\d{4}|\d+%|\d+\.\d+/g.test(content)) accuracyScore += 0.1;
    if (/important de noter|il faut préciser/gi.test(content)) accuracyScore += 0.1;
    
    // Nuances (signe de précision)
    if (/cependant|néanmoins|en général|habituellement/gi.test(content)) accuracyScore += 0.1;
    
    return Math.min(accuracyScore, 1.0);
  }

  assessCreativity(response) {
    const content = response.content || '';
    let creativityScore = 0.3;
    
    // Métaphores et analogies
    if (/comme|tel que|à l'image de|semblable à/gi.test(content)) creativityScore += 0.15;
    
    // Exemples originaux
    if (/imaginez|visualisez|pensez à/gi.test(content)) creativityScore += 0.1;
    
    // Variété lexicale
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    const lexicalDiversity = uniqueWords.size / Math.max(words.length, 1);
    
    if (lexicalDiversity > 0.6) creativityScore += 0.2;
    if (lexicalDiversity > 0.8) creativityScore += 0.1;
    
    // Expressions créatives
    if (/original|créatif|innovant|unique/gi.test(content)) creativityScore += 0.1;
    
    return Math.min(creativityScore, 1.0);
  }

  predictUserSatisfaction(response, context) {
    let satisfactionScore = 0.5;
    
    // Qualité de base
    const contentLength = response.content?.length || 0;
    if (contentLength > 100 && contentLength < 1000) satisfactionScore += 0.2;
    
    // Réponse à la demande
    if (context.queryComplexity === 'simple' && contentLength < 500) satisfactionScore += 0.1;
    if (context.queryComplexity === 'complex' && contentLength > 300) satisfactionScore += 0.15;
    
    // Ton approprié
    if (context.userTone === 'formal' && /professionnel|expert/gi.test(response.content || '')) {
      satisfactionScore += 0.1;
    }
    if (context.userTone === 'casual' && /sympa|cool|génial/gi.test(response.content || '')) {
      satisfactionScore += 0.1;
    }
    
    return Math.min(satisfactionScore, 1.0);
  }

  assessRetentionPotential(response, context) {
    let retentionScore = 0.3;
    
    const content = response.content || '';
    
    // Questions pour continuer la conversation
    if (/autres questions|puis-je vous aider|souhaitez-vous/gi.test(content)) {
      retentionScore += 0.2;
    }
    
    // Valeur ajoutée
    if (/conseil|tip|astuce|recommandation/gi.test(content)) {
      retentionScore += 0.15;
    }
    
    // Personnalisation
    if (/dans votre cas|pour vous|selon votre/gi.test(content)) {
      retentionScore += 0.15;
    }
    
    // Invitation à revenir
    if (/n'hésitez pas à revenir|recontactez-moi/gi.test(content)) {
      retentionScore += 0.2;
    }
    
    return Math.min(retentionScore, 1.0);
  }
}

export default AdvancedResponseScorer;
