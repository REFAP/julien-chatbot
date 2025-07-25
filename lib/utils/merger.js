// lib/utils/merger.js
// Système de Fusion Intelligent - La Magie du Dual Brain

import AdvancedResponseScorer from './scorer.js';
import { config } from './config.js';

export class IntelligentFusionSystem {
  constructor() {
    this.scorer = new AdvancedResponseScorer();
    this.fusionHistory = new Map();
    this.successPatterns = new Map();
    this.optimizationData = {
      bestStrategies: new Map(),
      userPreferences: new Map(),
      conversionOptimizations: []
    };
  }

  // 🧬 POINT D'ENTRÉE PRINCIPAL - Fusion Magique
  async fuseResponses(claudeResponse, openaiResponse, originalQuery, context = {}) {
    const startTime = Date.now();
    
    console.log('🧬 Fusion magique: Analyse et combinaison...');
    
    try {
      // 1. ANALYSE APPROFONDIE des deux réponses
      const claudeAnalysis = this.scorer.analyzeResponse(claudeResponse, originalQuery, { ...context, ai: 'claude' });
      const openaiAnalysis = this.scorer.analyzeResponse(openaiResponse, originalQuery, { ...context, ai: 'openai' });
      
      // 2. SÉLECTION DE LA STRATÉGIE OPTIMALE
      const fusionStrategy = this.selectOptimalFusionStrategy(claudeAnalysis, openaiAnalysis, context);
      
      // 3. FUSION SELON LA STRATÉGIE CHOISIE
      const fusedResult = await this.executeFusionStrategy(
        fusionStrategy,
        claudeResponse,
        openaiResponse,
        claudeAnalysis,
        openaiAnalysis,
        originalQuery,
        context
      );
      
      // 4. POST-TRAITEMENT et OPTIMISATION
      const finalResult = this.postProcessFusion(fusedResult, claudeAnalysis, openaiAnalysis, context);
      
      // 5. APPRENTISSAGE et MÉMORISATION
      this.learnFromFusion(fusionStrategy, finalResult, context);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✨ Fusion complétée: ${fusionStrategy} en ${processingTime}ms (Score: ${finalResult.metadata.confidence.toFixed(2)})`);
      
      return {
        ...finalResult,
        metadata: {
          ...finalResult.metadata,
          fusionStrategy,
          processingTime,
          claudeScore: claudeAnalysis.globalScore,
          openaiScore: openaiAnalysis.globalScore,
          fusionTimestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('💥 Erreur fusion:', error);
      return this.createFallbackFusion(claudeResponse, openaiResponse, error);
    }
  }

  // 🎯 SÉLECTION DE LA STRATÉGIE DE FUSION OPTIMALE
  selectOptimalFusionStrategy(claudeAnalysis, openaiAnalysis, context) {
    const claudeScore = claudeAnalysis.globalScore;
    const openaiScore = openaiAnalysis.globalScore;
    const scoreDifference = Math.abs(claudeScore - openaiScore);
    
    // Analyse du contexte business
    const isBusinessContext = claudeAnalysis.businessValue > 0.6 || openaiAnalysis.businessValue > 0.6;
    const isConversionOpportunity = claudeAnalysis.conversionPotential > 0.7 || openaiAnalysis.conversionPotential > 0.7;
    const isPremiumUser = context.premiumAccess || false;
    
    console.log(`📊 Scores: Claude ${claudeScore.toFixed(2)} | OpenAI ${openaiScore.toFixed(2)} | Diff ${scoreDifference.toFixed(2)}`);
    
    // STRATÉGIE 1: DOMINANCE CLAIRE (écart > 0.25)
    if (scoreDifference > 0.25) {
      const winner = claudeScore > openaiScore ? 'claude' : 'openai';
      const strategy = winner === 'claude' ? 'claude_enhanced' : 'openai_enhanced';
      console.log(`🏆 Dominance ${winner} détectée → ${strategy}`);
      return strategy;
    }
    
    // STRATÉGIE 2: CONVERSION BUSINESS (opportunité de lead)
    if (isBusinessContext && isConversionOpportunity && !isPremiumUser) {
      console.log('💰 Contexte conversion → hybrid_conversion');
      return 'hybrid_conversion';
    }
    
    // STRATÉGIE 3: PREMIUM EXCELLENCE (utilisateur premium)
    if (isPremiumUser) {
      console.log('💎 Utilisateur premium → molecular_fusion');
      return 'molecular_fusion';
    }
    
    // STRATÉGIE 4: ÉQUILIBRE PARFAIT (scores proches)
    if (scoreDifference < 0.1) {
      console.log('⚖️ Équilibre parfait → best_of_both');
      return 'best_of_both';
    }
    
    // STRATÉGIE PAR DÉFAUT: FUSION ADAPTATIVE
    console.log('🔄 Stratégie par défaut → adaptive_merge');
    return 'adaptive_merge';
  }

  // 🚀 EXÉCUTION DE LA STRATÉGIE DE FUSION
  async executeFusionStrategy(strategy, claudeResponse, openaiResponse, claudeAnalysis, openaiAnalysis, query, context) {
    
    switch (strategy) {
      case 'claude_enhanced':
        return this.claudeEnhancedFusion(claudeResponse, openaiResponse, claudeAnalysis, openaiAnalysis);
        
      case 'openai_enhanced':
        return this.openaiEnhancedFusion(openaiResponse, claudeResponse, openaiAnalysis, claudeAnalysis);
        
      case 'molecular_fusion':
        return this.molecularFusion(claudeResponse, openaiResponse, claudeAnalysis, openaiAnalysis, context);
        
      case 'hybrid_conversion':
        return this.hybridConversionFusion(claudeResponse, openaiResponse, claudeAnalysis, openaiAnalysis, context);
        
      case 'best_of_both':
        return this.bestOfBothFusion(claudeResponse, openaiResponse, claudeAnalysis, openaiAnalysis);
        
      case 'adaptive_merge':
        return this.adaptiveMergeFusion(claudeResponse, openaiResponse, claudeAnalysis, openaiAnalysis, query);
        
      default:
        return this.fallbackMerge(claudeResponse, openaiResponse);
    }
  }

  // 🧠 CLAUDE ENHANCED - Claude dominant, enrichi par OpenAI
  claudeEnhancedFusion(claudeResponse, openaiResponse, claudeAnalysis, openaiAnalysis) {
    console.log('🧠 Fusion Claude Enhanced: Précision + Engagement');
    
    const claudeContent = claudeResponse.content || '';
    const openaiContent = openaiResponse.content || '';
    
    // Structure de base: Claude (précision et facts)
    let fusedContent = claudeContent;
    
    // Enrichissement 1: Amélioration du ton avec OpenAI
    const openaiTone = this.extractEngagementElements(openaiContent);
    if (openaiTone.friendly && !this.hasFriendlyTone(claudeContent)) {
      fusedContent = this.injectFriendlyTone(fusedContent, openaiTone.friendly);
    }
    
    // Enrichissement 2: Call-to-actions d'OpenAI
    const openaiCTAs = this.extractCallToActions(openaiContent);
    if (openaiCTAs.length > 0 && !this.hasCallToAction(claudeContent)) {
      fusedContent = this.appendCallToAction(fusedContent, openaiCTAs[0]);
    }
    
    // Enrichissement 3: Exemples créatifs d'OpenAI
    const openaiExamples = this.extractCreativeExamples(openaiContent);
    if (openaiExamples.length > 0 && this.needsExamples(claudeContent)) {
      fusedContent = this.integrateExample(fusedContent, openaiExamples[0]);
    }
    
    return {
      content: this.polishContent(fusedContent),
      strategy: 'claude_enhanced',
      dominantAI: 'claude',
      enhancements: ['tone_improvement', 'cta_addition', 'creative_examples'],
      confidence: Math.max(claudeAnalysis.globalScore + 0.1, 0.9)
    };
  }

  // 🎨 OPENAI ENHANCED - OpenAI dominant, validé par Claude
  openaiEnhancedFusion(openaiResponse, claudeResponse, openaiAnalysis, claudeAnalysis) {
    console.log('🎨 Fusion OpenAI Enhanced: Créativité + Précision');
    
    const openaiContent = openaiResponse.content || '';
    const claudeContent = claudeResponse.content || '';
    
    // Base créative: OpenAI
    let fusedContent = openaiContent;
    
    // Validation 1: Injection de données factuelles de Claude
    const claudeFacts = this.extractFactualData(claudeContent);
    if (claudeFacts.length > 0 && this.needsFactualSupport(openaiContent)) {
      fusedContent = this.integrateFactualData(fusedContent, claudeFacts);
    }
    
    // Validation 2: Précisions techniques de Claude
    const claudePrecisions = this.extractTechnicalPrecisions(claudeContent);
    if (claudePrecisions.length > 0) {
      fusedContent = this.addTechnicalPrecisions(fusedContent, claudePrecisions);
    }
    
    // Validation 3: Avertissements de sécurité de Claude
    const claudeWarnings = this.extractSafetyWarnings(claudeContent);
    if (claudeWarnings.length > 0) {
      fusedContent = this.integrateSafetyWarnings(fusedContent, claudeWarnings);
    }
    
    return {
      content: this.polishContent(fusedContent),
      strategy: 'openai_enhanced',
      dominantAI: 'openai',
      validations: ['factual_support', 'technical_precision', 'safety_warnings'],
      confidence: Math.max(openaiAnalysis.globalScore + 0.1, 0.9)
    };
  }

  // 🧬 MOLECULAR FUSION - Fusion moléculaire premium
  molecularFusion(claudeResponse, openaiResponse, claudeAnalysis, openaiAnalysis, context) {
    console.log('🧬 Fusion Moléculaire: Alchimie premium');
    
    // Décomposition moléculaire des contenus
    const claudeElements = this.decomposeMolecularly(claudeResponse.content || '');
    const openaiElements = this.decomposeMolecularly(openaiResponse.content || '');
    
    // Reconstruction intelligente
    const reconstruction = {
      introduction: this.selectBestIntroduction(claudeElements.introduction, openaiElements.introduction),
      mainPoints: this.fuseMainPoints(claudeElements.mainPoints, openaiElements.mainPoints),
      examples: this.combineExamples(claudeElements.examples, openaiElements.examples),
      technicalDetails: this.mergeTechnicalDetails(claudeElements.technical, openaiElements.technical),
      conclusion: this.craftPremiumConclusion(claudeElements.conclusion, openaiElements.conclusion, context)
    };
    
    // Assemblage final premium
    const premiumContent = this.assemblePremiumContent(reconstruction);
    
    return {
      content: premiumContent,
      strategy: 'molecular_fusion',
      premiumFeatures: ['dual_validation', 'enhanced_creativity', 'premium_structure'],
      confidence: (claudeAnalysis.globalScore + openaiAnalysis.globalScore) / 2 + 0.15
    };
  }

  // 💰 HYBRID CONVERSION - Optimisé pour conversion business
  hybridConversionFusion(claudeResponse, openaiResponse, claudeAnalysis, openaiAnalysis, context) {
    console.log('💰 Fusion Conversion: Optimisation business');
    
    // Stratégie: Valeur immédiate + appel à l'action premium
    
    // 1. Réponse de qualité immédiate (le meilleur des deux)
    const bestContent = claudeAnalysis.globalScore > openaiAnalysis.globalScore ? 
      claudeResponse.content : openaiResponse.content;
    
    // 2. Enrichissement avec éléments de l'autre IA
    const secondaryContent = claudeAnalysis.globalScore > openaiAnalysis.globalScore ? 
      openaiResponse.content : claudeResponse.content;
    
    let conversionOptimizedContent = bestContent;
    
    // 3. Injection d'éléments d'engagement
    const engagementBoosts = this.extractEngagementBoosts(secondaryContent);
    conversionOptimizedContent = this.applyEngagementBoosts(conversionOptimizedContent, engagementBoosts);
    
    // 4. Optimisation pour conversion
    conversionOptimizedContent = this.optimizeForConversion(conversionOptimizedContent, context);
    
    // 5. Préparation du teasing premium
    const premiumTeasing = this.generatePremiumTeasing(claudeAnalysis, openaiAnalysis);
    
    return {
      content: conversionOptimizedContent,
      strategy: 'hybrid_conversion',
      conversionElements: {
        valueDelivered: true,
        engagementOptimized: true,
        premiumTeasing: premiumTeasing
      },
      confidence: Math.max(claudeAnalysis.globalScore, openaiAnalysis.globalScore) + 0.05
    };
  }

  // 🏆 BEST OF BOTH - Meilleur de chaque IA
  bestOfBothFusion(claudeResponse, openaiResponse, claudeAnalysis, openaiAnalysis) {
    console.log('🏆 Fusion Best of Both: Symbiose parfaite');
    
    // Identification des forces de chaque IA
    const claudeStrengths = this.identifyStrengths(claudeResponse.content, claudeAnalysis);
    const openaiStrengths = this.identifyStrengths(openaiResponse.content, openaiAnalysis);
    
    // Construction par blocs de force
    const fusionBlocks = [];
    
    // Bloc 1: Introduction (force créative d'OpenAI généralement)
    if (openaiStrengths.includes('engagement') || openaiStrengths.includes('creativity')) {
      fusionBlocks.push(this.extractIntroduction(openaiResponse.content));
    } else {
      fusionBlocks.push(this.extractIntroduction(claudeResponse.content));
    }
    
    // Bloc 2: Contenu principal (force analytique de Claude généralement)
    if (claudeStrengths.includes('accuracy') || claudeStrengths.includes('structure')) {
      fusionBlocks.push(this.extractMainContent(claudeResponse.content));
    } else {
      fusionBlocks.push(this.extractMainContent(openaiResponse.content));
    }
    
    // Bloc 3: Exemples et détails (force de l'IA la plus créative)
    const creativeContent = openaiAnalysis.creativity > claudeAnalysis.creativity ? 
      openaiResponse.content : claudeResponse.content;
    const examples = this.extractExamples(creativeContent);
    if (examples.length > 0) {
      fusionBlocks.push(examples.join(' '));
    }
    
    // Bloc 4: Conclusion (force conversationnelle d'OpenAI généralement)
    if (openaiStrengths.includes('engagement')) {
      fusionBlocks.push(this.extractConclusion(openaiResponse.content));
    } else {
      fusionBlocks.push(this.extractConclusion(claudeResponse.content));
    }
    
    return {
      content: this.assembleBlocks(fusionBlocks),
      strategy: 'best_of_both',
      composition: {
        claudeBlocks: claudeStrengths.length,
        openaiBlocks: openaiStrengths.length,
        synergy: 'optimal'
      },
      confidence: (claudeAnalysis.globalScore + openaiAnalysis.globalScore) / 2 + 0.1
    };
  }

  // 🔄 ADAPTIVE MERGE - Fusion adaptative intelligente
  adaptiveMergeFusion(claudeResponse, openaiResponse, claudeAnalysis, openaiAnalysis, query) {
    console.log('🔄 Fusion Adaptative: Intelligence contextuelle');
    
    // Analyse contextuelle de la requête
    const queryContext = this.analyzeQueryContext(query);
    
    let fusionApproach;
    
    if (queryContext.isFactual) {
      // Question factuelle: base Claude + fluidité OpenAI
      fusionApproach = this.factualFusion(claudeResponse, openaiResponse);
    } else if (queryContext.isCreative) {
      // Question créative: base OpenAI + validation Claude
      fusionApproach = this.creativeFusion(openaiResponse, claudeResponse);
    } else if (queryContext.isTechnical) {
      // Question technique: expertise Claude + accessibilité OpenAI
      fusionApproach = this.technicalFusion(claudeResponse, openaiResponse);
    } else {
      // Cas général: fusion équilibrée
      fusionApproach = this.balancedFusion(claudeResponse, openaiResponse);
    }
    
    return {
      content: fusionApproach.content,
      strategy: 'adaptive_merge',
      adaptedFor: queryContext.primaryType,
      confidence: fusionApproach.confidence
    };
  }

  // 🛠️ UTILITAIRES DE DÉCOMPOSITION ET EXTRACTION

  decomposeMolecularly(content) {
    if (!content) return { introduction: '', mainPoints: [], examples: [], technical: [], conclusion: '' };
    
    const sentences = this.splitIntoSentences(content);
    
    return {
      introduction: sentences[0] || '',
      mainPoints: this.extractMainPoints(sentences),
      examples: this.extractExamples(content),
      technical: this.extractTechnicalDetails(content),
      conclusion: sentences[sentences.length - 1] || ''
    };
  }

  extractEngagementElements(content) {
    return {
      friendly: this.extractFriendlyExpressions(content),
      questions: this.extractQuestions(content),
      enthusiasm: this.extractEnthusiasm(content),
      personal: this.extractPersonalTouch(content)
    };
  }

  extractFactualData(content) {
    const factualPatterns = [
      /selon.*?\./gi,
      /\d+%.*?\./gi,
      /basé sur.*?\./gi,
      /études montrent.*?\./gi,
      /il est prouvé.*?\./gi
    ];
    
    const facts = [];
    factualPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      facts.push(...matches);
    });
    
    return facts;
  }

  extractTechnicalPrecisions(content) {
    const technicalPatterns = [
      /il faut noter.*?\./gi,
      /attention.*?\./gi,
      /important.*?\./gi,
      /précisément.*?\./gi,
      /techniquement.*?\./gi
    ];
    
    const precisions = [];
    technicalPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      precisions.push(...matches);
    });
    
    return precisions;
  }

  extractSafetyWarnings(content) {
    const safetyPatterns = [
      /sécurité.*?\./gi,
      /danger.*?\./gi,
      /risque.*?\./gi,
      /prudence.*?\./gi,
      /attention.*sécurité.*?\./gi
    ];
    
    const warnings = [];
    safetyPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      warnings.push(...matches);
    });
    
    return warnings;
  }

  extractCallToActions(content) {
    const ctaPatterns = [
      /n'hésitez pas.*?\./gi,
      /contactez.*?\./gi,
      /appelez.*?\./gi,
      /consultez.*?\./gi,
      /rendez-vous.*?\./gi
    ];
    
    const ctas = [];
    ctaPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      ctas.push(...matches);
    });
    
    return ctas;
  }

  extractCreativeExamples(content) {
    const examplePatterns = [
      /par exemple.*?\./gi,
      /comme.*?\./gi,
      /imaginez.*?\./gi,
      /pensez à.*?\./gi
    ];
    
    const examples = [];
    examplePatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      examples.push(...matches);
    });
    
    return examples;
  }

  // 🎨 ASSEMBLAGE ET POLISSAGE

  assemblePremiumContent(reconstruction) {
    const parts = [];
    
    if (reconstruction.introduction) parts.push(reconstruction.introduction);
    if (reconstruction.mainPoints.length > 0) parts.push(reconstruction.mainPoints.join(' '));
    if (reconstruction.examples.length > 0) parts.push(reconstruction.examples.join(' '));
    if (reconstruction.technicalDetails.length > 0) parts.push(reconstruction.technicalDetails.join(' '));
    if (reconstruction.conclusion) parts.push(reconstruction.conclusion);
    
    return this.polishContent(parts.join('\n\n'));
  }

  polishContent(content) {
    if (!content) return '';
    
    return content
      .replace(/\s+/g, ' ')                    // Espaces multiples
      .replace(/\. \./g, '.')                  // Points doubles
      .replace(/([.!?])\s*([a-z])/g, '$1 $2')  // Espacement ponctuation
      .replace(/\n\s*\n/g, '\n\n')             // Lignes vides multiples
      .trim();
  }

  // 🧠 INTELLIGENCE CONTEXTUELLE

  analyzeQueryContext(query) {
    const lowerQuery = query.toLowerCase();
    
    const context = {
      isFactual: /qui|que|quoi|quand|où|combien|comment|pourquoi|définition|expliquer/i.test(query),
      isCreative: /créer|imaginer|inventer|idée|conception|design/i.test(query),
      isTechnical: /technique|mécanisme|processus|diagnostic|réparer/i.test(query),
      isConversational: /que penses-tu|ton avis|opinion/i.test(query),
      isUrgent: /urgent|rapidement|vite|immédiatement/i.test(query),
      isBusinessRelated: /garage|réparation|entretien|voiture|auto/i.test(query)
    };
    
    // Détermination du type principal
    const trueContexts = Object.entries(context).filter(([_, value]) => value);
    context.primaryType = trueContexts.length > 0 ? trueContexts[0][0] : 'general';
    
    return context;
  }

  // 🎯 FUSIONS SPÉCIALISÉES

  factualFusion(claudeResponse, openaiResponse) {
    // Claude pour les faits, OpenAI pour fluidifier
    let baseContent = claudeResponse.content || '';
    const openaiTone = this.extractTone(openaiResponse.content || '');
    
    if (openaiTone.conversational && !this.isConversational(baseContent)) {
      baseContent = this.makeMoreConversational(baseContent, openaiTone);
    }
    
    return {
      content: baseContent,
      confidence: 0.85
    };
  }

  creativeFusion(openaiResponse, claudeResponse) {
    // OpenAI pour la créativité, Claude pour valider
    let baseContent = openaiResponse.content || '';
    const claudeFacts = this.extractFactualData(claudeResponse.content || '');
    
    if (claudeFacts.length > 0 && this.needsValidation(baseContent)) {
      baseContent = this.addValidation(baseContent, claudeFacts[0]);
    }
    
    return {
      content: baseContent,
      confidence: 0.82
    };
  }

  technicalFusion(claudeResponse, openaiResponse) {
    // Claude pour l'expertise, OpenAI pour l'accessibilité
    let technicalContent = claudeResponse.content || '';
    const openaiAccessibility = this.extractAccessibilityElements(openaiResponse.content || '');
    
    if (this.isTooTechnical(technicalContent) && openaiAccessibility.simplifications) {
      technicalContent = this.addSimplifications(technicalContent, openaiAccessibility.simplifications);
    }
    
    return {
      content: technicalContent,
      confidence: 0.87
    };
  }

  balancedFusion(claudeResponse, openaiResponse) {
    // Fusion équilibrée 50/50
    const claudeSentences = this.splitIntoSentences(claudeResponse.content || '');
    const openaiSentences = this.splitIntoSentences(openaiResponse.content || '');
    
    const balanced = this.interleaveContent(claudeSentences, openaiSentences);
    
    return {
      content: balanced,
      confidence: 0.75
    };
  }

  // 🔧 UTILITAIRES GÉNÉRAUX

  splitIntoSentences(content) {
    if (!content) return [];
    return content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  }

  extractMainPoints(sentences) {
    // Extraction des points principaux (phrases > 50 caractères)
    return sentences.filter(sentence => sentence.length > 50 && sentence.length < 200);
  }

  extractExamples(content) {
    const examplePattern = /(par exemple|comme|tel que|notamment).*?[.!?]/gi;
    return content.match(examplePattern) || [];
  }

  extractTechnicalDetails(content) {
    const technicalPattern = /(techniquement|mécaniquement|spécifiquement).*?[.!?]/gi;
    return content.match(technicalPattern) || [];
  }

  extractIntroduction(content) {
    const sentences = this.splitIntoSentences(content);
    return sentences[0] || '';
  }

  extractMainContent(content) {
    const sentences = this.splitIntoSentences(content);
    return sentences.slice(1, -1).join(' ');
  }

  extractConclusion(content) {
    const sentences = this.splitIntoSentences(content);
    return sentences[sentences.length - 1] || '';
  }

  identifyStrengths(content, analysis) {
    const strengths = [];
    
    if (analysis.accuracy > 0.8) strengths.push('accuracy');
    if (analysis.creativity > 0.8) strengths.push('creativity');
    if (analysis.engagement > 0.8) strengths.push('engagement');
    if (analysis.clarity > 0.8) strengths.push('clarity');
    if (analysis.businessValue > 0.8) strengths.push('business_value');
    
    return strengths;
  }

  assembleBlocks(blocks) {
    return blocks.filter(block => block && block.trim().length > 0).join('\n\n');
  }

  // 📊 POST-TRAITEMENT ET OPTIMISATION

  postProcessFusion(fusedResult, claudeAnalysis, openaiAnalysis, context) {
    let optimizedContent = fusedResult.content;
    
    // Optimisation de longueur
    if (context.preferShort && optimizedContent.length > 800) {
      optimizedContent = this.condenseContent(optimizedContent);
    }
    
    // Optimisation de ton selon le contexte
    if (context.formalContext && this.isTooColloquial(optimizedContent)) {
      optimizedContent = this.formalizeTone(optimizedContent);
    }
    
    // Optimisation business
    if (context.businessOptimization && !this.hasBusinessValue(optimizedContent)) {
      optimizedContent = this.addBusinessValue(optimizedContent, context);
    }
    
    return {
      ...fusedResult,
      content: optimizedContent,
      metadata: {
        confidence: fusedResult.confidence || 0.8,
        optimizations: ['length', 'tone', 'business'],
        source: 'dual_brain_fusion'
      }
    };
  }

  // 📈 APPRENTISSAGE ET MÉMORISATION

  learnFromFusion(strategy, result, context) {
    // Mémorisation des patterns réussis
    const successMetrics = {
      strategy,
      confidence: result.metadata?.confidence || 0,
      context: {
        premiumUser: context.premiumAccess || false,
        businessContext: context.businessContext || false,
        queryType: context.queryType || 'general'
      },
      timestamp: Date.now()
    };
    
    // Stockage pour optimisation future
    if (successMetrics.confidence > 0.8) {
      this.successPatterns.set(
        `${strategy}_${successMetrics.context.queryType}`,
        successMetrics
      );
    }
    
    // Mise à jour des stratégies optimales
    const currentBest = this.optimizationData.bestStrategies.get(context.queryType || 'general') || { confidence: 0 };
    if (successMetrics.confidence > currentBest.confidence) {
      this.optimizationData.bestStrategies.set(context.queryType || 'general', successMetrics);
    }
  }

  // 🚨 GESTION D'ERREURS

  createFallbackFusion(claudeResponse, openaiResponse, error) {
    console.warn('⚠️ Fusion fallback activée:', error.message);
    
    // Sélection du meilleur contenu disponible
    const claudeContent = claudeResponse?.content || '';
    const openaiContent = openaiResponse?.content || '';
    
    const bestContent = claudeContent.length > openaiContent.length ? claudeContent : openaiContent;
    
    return {
      content: bestContent || 'Je rencontre des difficultés temporaires. Pouvez-vous reformuler votre question ?',
      strategy: 'fallback',
      error: true,
      metadata: {
        confidence: 0.5,
        errorHandled: true,
        originalError: error.message
      }
    };
  }

  fallbackMerge(claudeResponse, openaiResponse) {
    // Fusion simple en cas d'erreur
    const content1 = claudeResponse?.content || '';
    const content2 = openaiResponse?.content || '';
    
    return {
      content: content1 || content2 || 'Contenu indisponible',
      strategy: 'simple_fallback',
      confidence: 0.6
    };
  }

  // Méthodes utilitaires simplifiées (pour éviter les erreurs)
  hasFriendlyTone(content) { return /sympa|génial|super|excellent/i.test(content); }
  hasCallToAction(content) { return /n'hésitez pas|contactez|appelez/i.test(content); }
  needsExamples(content) { return content.length > 300 && !/par exemple|comme/i.test(content); }
  needsFactualSupport(content) { return !/selon|basé sur|études/i.test(content); }
  isConversational(content) { return /vous|votre|\?/g.test(content); }
  isTooTechnical(content) { return content.split(' ').filter(word => word.length > 10).length > 5; }
  needsValidation(content) { return content.length > 200 && !/selon|prouvé/i.test(content); }
  isTooColloquial(content) { return /super|génial|cool|sympa/i.test(content); }
  hasBusinessValue(content) { return /garage|réparation|diagnostic|coût/i.test(content); }

  // Méthodes de transformation simplifiées
  injectFriendlyTone(content, tone) { return content; }
  appendCallToAction(content, cta) { return content + '\n\n' + cta; }
  integrateExample(content, example) { return content + '\n\n' + example; }
  integrateFactualData(content, facts) { return content + '\n\nÀ noter : ' + facts[0]; }
  addTechnicalPrecisions(content, precisions) { return content; }
  integrateSafetyWarnings(content, warnings) { return content + '\n\n⚠️ ' + warnings[0]; }
  makeMoreConversational(content, tone) { return content; }
  addValidation(content, fact) { return content + '\n\n' + fact; }
  addSimplifications(content, simplifications) { return content; }
  condenseContent(content) { return content.substring(0, 600) + '...'; }
  formalizeTone(content) { return content.replace(/super|génial/gi, 'excellent'); }
  addBusinessValue(content, context) { return content; }
  interleaveContent(sentences1, sentences2) { return [...sentences1, ...sentences2].join(' '); }

  // Extraction de patterns
  extractTone(content) { return { conversational: this.isConversational(content) }; }
  extractAccessibilityElements(content) { return { simplifications: [] }; }
  extractEngagementBoosts(content) { return []; }
  extractFriendlyExpressions(content) { return ''; }
  extractQuestions(content) { return []; }
  extractEnthusiasm(content) { return ''; }
  extractPersonalTouch(content) { return ''; }

  // Transformations
  applyEngagementBoosts(content, boosts) { return content; }
  optimizeForConversion(content, context) { return content; }
  generatePremiumTeasing(claudeAnalysis, openaiAnalysis) { return 'Accédez à notre analyse premium !'; }
  selectBestIntroduction(intro1, intro2) { return intro1 || intro2; }
  fuseMainPoints(points1, points2) { return [...points1, ...points2]; }
  combineExamples(examples1, examples2) { return [...examples1, ...examples2]; }
  mergeTechnicalDetails(tech1, tech2) { return [...tech1, ...tech2]; }
  craftPremiumConclusion(concl1, concl2, context) { return concl1 || concl2; }
}

export default IntelligentFusionSystem;
