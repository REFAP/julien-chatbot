// lib/ai/claude.js
// Interface Claude API optimisée pour le système Dual Brain + Lead Generation

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../utils/config.js';

export class ClaudeClient {
  constructor() {
    if (!config.apis.claude.apiKey) {
      throw new Error('CLAUDE_API_KEY manquante dans les variables d\'environnement');
    }
    
    this.client = new Anthropic({
      apiKey: config.apis.claude.apiKey,
    });
    
    this.requestCount = 0;
    this.errorCount = 0;
  }

  // 🎯 GÉNÉRATION DE RÉPONSE PRINCIPALE
  async generateResponse(prompt, context = {}) {
    const startTime = Date.now();
    this.requestCount++;

    try {
      // Optimisation du prompt pour Claude selon le contexte business
      const optimizedPrompt = this.optimizePromptForClaude(prompt, context);
      
      console.log(`🔵 Claude: Traitement "${prompt.substring(0, 50)}..."`);

      const response = await this.client.messages.create({
        model: config.apis.claude.model,
        max_tokens: config.apis.claude.maxTokens,
        temperature: config.apis.claude.temperature,
        messages: [
          {
            role: 'user',
            content: optimizedPrompt
          }
        ]
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Analyse de la qualité de la réponse pour le business model
      const qualityMetrics = this.analyzeResponseQuality(response.content[0].text, prompt);

      const result = {
        success: true,
        content: response.content[0].text,
        metadata: {
          model: config.apis.claude.model,
          responseTime,
          tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
          source: 'claude',
          qualityScore: qualityMetrics.overallScore,
          businessRelevance: qualityMetrics.businessRelevance,
          timestamp: new Date().toISOString()
        }
      };

      console.log(`✅ Claude: ${responseTime}ms (Score: ${qualityMetrics.overallScore.toFixed(2)})`);
      
      return result;

    } catch (error) {
      this.errorCount++;
      console.error('❌ Erreur Claude API:', error.message);
      
      return {
        success: false,
        content: '',
        error: error.message,
        metadata: {
          source: 'claude',
          responseTime: Date.now() - startTime,
          errorType: this.categorizeError(error)
        }
      };
    }
  }

  // 🔧 OPTIMISATION DU PROMPT POUR CLAUDE
  optimizePromptForClaude(originalPrompt, context) {
    let optimizedPrompt = originalPrompt;
    
    // Claude excelle en analyse et structuration - on l'oriente vers ses forces
    const isPremiumUser = context.premiumAccess || false;
    const detectedAutoTopic = this.detectAutoTopic(originalPrompt);
    
    // Si c'est un utilisateur premium ET sujet auto, on optimise pour la précision
    if (isPremiumUser && detectedAutoTopic) {
      optimizedPrompt = `En tant qu'expert automobile, analysez cette question avec précision et structure :

QUESTION: ${originalPrompt}

Fournissez une réponse:
- Factuelle et précise
- Bien structurée avec des points clés
- Incluant des données techniques si pertinent
- Avec des conseils pratiques
- Mentionnant les aspects sécurité si nécessaire

Réponse détaillée:`;
    }
    
    // Pour les questions générales, on encourage la structure et la précision
    else if (this.isFactualQuery(originalPrompt)) {
      optimizedPrompt = `Analysez et répondez de manière structurée et précise à cette question:

${originalPrompt}

Organisez votre réponse avec:
1. Points clés
2. Explications détaillées
3. Exemples concrets si applicable`;
    }
    
    // Pour les questions techniques auto, on met l'accent sur l'expertise
    else if (detectedAutoTopic) {
      optimizedPrompt = `En tant qu'expert technique automobile, répondez à cette question avec précision:

${originalPrompt}

Incluez:
- Diagnostic technique
- Solutions recommandées  
- Aspects de sécurité
- Estimation de coûts si pertinent`;
    }

    return optimizedPrompt;
  }

  // 🚗 Détection de sujets automobiles pour optimiser la réponse
  detectAutoTopic(prompt) {
    const autoKeywords = [
      'voiture', 'auto', 'véhicule', 'moteur', 'garage', 'mécanique',
      'pneu', 'frein', 'vidange', 'révision', 'entretien', 'réparation',
      'carrosserie', 'panne', 'diagnostic', 'huile', 'batterie',
      'embrayage', 'transmission', 'suspension', 'climatisation'
    ];
    
    const lowerPrompt = prompt.toLowerCase();
    return autoKeywords.some(keyword => lowerPrompt.includes(keyword));
  }

  // 📊 ANALYSE DE LA QUALITÉ DE LA RÉPONSE
  analyzeResponseQuality(responseContent, originalPrompt) {
    const metrics = {
      accuracy: this.assessAccuracy(responseContent, originalPrompt),
      structure: this.assessStructure(responseContent),
      completeness: this.assessCompleteness(responseContent, originalPrompt),
      businessRelevance: this.assessBusinessRelevance(responseContent),
      technicalDepth: this.assessTechnicalDepth(responseContent)
    };

    // Score global pondéré selon les forces de Claude
    const claudeWeights = {
      accuracy: 0.35,        // Force principale de Claude
      structure: 0.25,       // Excellente structuration
      completeness: 0.2,     // Réponses complètes
      businessRelevance: 0.1, // Pour le lead generation
      technicalDepth: 0.1    // Bon en technique
    };

    const overallScore = Object.entries(metrics).reduce((total, [key, score]) => {
      return total + (score * claudeWeights[key]);
    }, 0);

    return {
      ...metrics,
      overallScore,
      strengths: this.identifyClaudeStrengths(metrics),
      recommendedUse: this.getRecommendedUse(metrics)
    };
  }

  // 🎯 Évaluation de la précision (force principale de Claude)
  assessAccuracy(content, prompt) {
    let score = 0.7; // Score de base élevé pour Claude
    
    // Indicateurs de précision factuelle
    const accuracyIndicators = [
      /selon|d'après|basé sur|études montrent/i,
      /\d{4}|\d+%|\d+\.\d+|environ \d+/,  // Données chiffrées
      /cependant|néanmoins|toutefois|en revanche/i,  // Nuances
      /important de noter|il faut préciser|attention/i  // Mise en garde
    ];

    accuracyIndicators.forEach(indicator => {
      if (indicator.test(content)) {
        score += 0.075;
      }
    });

    // Bonus pour mentions de sécurité (important en auto)
    if (/sécurité|danger|risque|attention|prudence/i.test(content)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  // 📋 Évaluation de la structure (autre force de Claude)
  assessStructure(content) {
    let score = 0.5;
    
    // Structure avec numérotation ou puces
    if (/^\d+\.|^-|^•|^\*/m.test(content)) {
      score += 0.2;
    }
    
    // Paragraphes bien définis
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length >= 2) {
      score += 0.15;
    }
    
    // Sous-titres ou sections
    if (/^[A-Z][^.!?]*:$/m.test(content) || /\*\*.*\*\*/.test(content)) {
      score += 0.15;
    }
    
    // Conclusion ou synthèse
    if (/en conclusion|en résumé|pour résumer|finalement|en bref/i.test(content)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  // 📏 Évaluation de la complétude
  assessCompleteness(content, prompt) {
    let score = 0.4;
    
    // Longueur appropriée
    if (content.length > 150 && content.length < 2000) {
      score += 0.2;
    }
    
    // Réponse aux différents aspects de la question
    const promptWords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const contentLower = content.toLowerCase();
    const addressedWords = promptWords.filter(word => contentLower.includes(word));
    
    if (addressedWords.length / promptWords.length > 0.5) {
      score += 0.2;
    }
    
    // Exemples concrets
    if (/par exemple|comme|tel que|notamment/i.test(content)) {
      score += 0.1;
    }
    
    // Conseils pratiques
    if (/conseille|recommande|suggère|il vaut mieux/i.test(content)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  // 💼 Évaluation de la pertinence business (pour le lead generation)
  assessBusinessRelevance(content) {
    let score = 0.3;
    
    // Mentions de services (potentiels leads)
    const businessKeywords = [
      'garage', 'mécanicien', 'spécialiste', 'professionnel', 'expert',
      'entretien', 'réparation', 'diagnostic', 'révision', 'contrôle',
      'coût', 'prix', 'budget', 'devis', 'facture'
    ];
    
    const contentLower = content.toLowerCase();
    const foundKeywords = businessKeywords.filter(keyword => 
      contentLower.includes(keyword)
    );
    
    score += Math.min(foundKeywords.length * 0.1, 0.5);
    
    // Recommandations d'action (potentiels triggers pour leads)
    if (/il faut|vous devez|je recommande|je conseille/i.test(content)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  // 🔧 Évaluation de la profondeur technique
  assessTechnicalDepth(content) {
    let score = 0.3;
    
    // Termes techniques spécialisés
    const technicalTerms = [
      'moteur', 'transmission', 'suspension', 'freinage', 'direction',
      'injection', 'turbo', 'catalyseur', 'alternateur', 'démarreur',
      'ABS', 'ESP', 'airbag', 'climatisation', 'échappement'
    ];
    
    const contentLower = content.toLowerCase();
    const foundTerms = technicalTerms.filter(term => contentLower.includes(term));
    
    score += Math.min(foundTerms.length * 0.1, 0.4);
    
    // Explications de processus
    if (/fonctionne|processus|mécanisme|système/i.test(content)) {
      score += 0.15;
    }
    
    // Données techniques précises
    if (/kw|ch|bars?|litres?|km\/h|°c|mm/i.test(content)) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  // 💪 Identification des forces spécifiques de cette réponse Claude
  identifyClaudeStrengths(metrics) {
    const strengths = [];
    
    if (metrics.accuracy > 0.8) strengths.push('précision_factuelle');
    if (metrics.structure > 0.8) strengths.push('excellente_structure');
    if (metrics.completeness > 0.8) strengths.push('réponse_complète');
    if (metrics.technicalDepth > 0.7) strengths.push('expertise_technique');
    if (metrics.businessRelevance > 0.6) strengths.push('pertinence_business');
    
    return strengths;
  }

  // 🎯 Recommandation d'usage pour la fusion Dual Brain
  getRecommendedUse(metrics) {
    if (metrics.accuracy > 0.8 && metrics.structure > 0.7) {
      return 'lead_response'; // Utiliser comme réponse principale
    } else if (metrics.technicalDepth > 0.7) {
      return 'technical_authority'; // Utiliser pour la partie technique
    } else if (metrics.structure > 0.8) {
      return 'content_structure'; // Utiliser pour structurer
    } else {
      return 'supporting_content'; // Utiliser en support
    }
  }

  // 🔍 Détection du type de question pour optimisation
  isFactualQuery(prompt) {
    const factualIndicators = /^(qui|que|quoi|quand|où|combien|comment|pourquoi|quel|quelle)/i;
    return factualIndicators.test(prompt.trim());
  }

  // 🚨 Catégorisation des erreurs pour le monitoring
  categorizeError(error) {
    if (error.message?.includes('rate limit')) return 'rate_limit';
    if (error.message?.includes('unauthorized')) return 'auth_error';
    if (error.message?.includes('timeout')) return 'timeout';
    if (error.message?.includes('network')) return 'network_error';
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
      const testResponse = await this.generateResponse('Test', { skipOptimization: true });
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

export default ClaudeClient;
