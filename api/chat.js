// api/chat.js
// Orchestrateur Maître - Cerveau Central de l'Empire Dual Brain

import DualBrainOrchestrator from '../lib/ai/dual-brain.js';
import AdvancedRateLimiter from '../lib/middleware/rateLimiter.js';
import { config, validateConfig } from '../lib/utils/config.js';

// Initialisation du système maître
let masterSystem = null;
let rateLimiter = null;

// Statistiques globales en temps réel
const globalStats = {
  totalRequests: 0,
  premiumConversions: 0,
  revenueGenerated: 0,
  systemUptime: Date.now(),
  peakConcurrency: 0,
  errorRate: 0
};

// Cache des sessions actives
const activeSessions = new Map();

// Initialisation lazy pour optimiser les performances
async function initializeMasterSystem() {
  if (!masterSystem) {
    console.log('🚀 Initialisation du Système Maître...');
    
    try {
      // Validation de la configuration
      if (!validateConfig()) {
        console.warn('⚠️ Configuration incomplète - Mode dégradé');
      }
      
      // Initialisation des composants
      masterSystem = new DualBrainOrchestrator();
      rateLimiter = new AdvancedRateLimiter();
      
      console.log('✅ Système Maître opérationnel - Empire Dual Brain activé');
      
    } catch (error) {
      console.error('💥 Erreur initialisation système:', error);
      throw new Error('Impossible d\'initialiser le système maître');
    }
  }
  
  return masterSystem;
}

export default async function handler(req, res) {
  const requestStart = Date.now();
  const requestId = generateRequestId();
  
  try {
    // Initialisation du système si nécessaire
    const system = await initializeMasterSystem();
    
    // Mise à jour des statistiques globales
    globalStats.totalRequests++;
    updatePeakConcurrency();
    
    // Configuration CORS pour votre frontend
    configureCORS(res);
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Seule méthode POST autorisée pour les conversations
    if (req.method !== 'POST') {
      return respondWithError(res, 405, 'METHOD_NOT_ALLOWED', 'Seule la méthode POST est supportée', requestId);
    }
    
    // Extraction et validation des données de requête
    const requestData = await validateAndExtractRequest(req, requestId);
    if (requestData.error) {
      return respondWithError(res, 400, requestData.error.code, requestData.error.message, requestId);
    }
    
    // Protection par rate limiting intelligent
    const rateLimitResult = await checkRateLimit(req, requestData);
    if (!rateLimitResult.allowed) {
      return respondWithRateLimit(res, rateLimitResult, requestId);
    }
    
    // LOG DE DÉMARRAGE
    console.log(`🧠 [${requestId}] Traitement: "${requestData.message.substring(0, 60)}..."`);
    console.log(`👤 Utilisateur: ${rateLimitResult.userType} | Session: ${requestData.sessionId}`);
    
    // TRAITEMENT PRINCIPAL PAR LE DUAL BRAIN
    const dualBrainResult = await processDualBrainRequest(system, requestData, rateLimitResult);
    
    // GESTION DE LA RÉPONSE SELON LE RÉSULTAT
    if (dualBrainResult.premiumOffer?.show) {
      // PARCOURS CONVERSION - Proposition d'upgrade
      return await handleConversionFlow(res, dualBrainResult, requestData, requestId);
    } else {
      // PARCOURS NORMAL - Réponse directe
      return await handleNormalFlow(res, dualBrainResult, requestData, requestId);
    }
    
  } catch (error) {
    // Gestion d'erreur globale avec analytics
    console.error(`💥 [${requestId}] Erreur système:`, error);
    globalStats.errorRate = (globalStats.errorRate * 0.95) + 0.05; // Rolling average
    
    return respondWithError(res, 500, 'SYSTEM_ERROR', 'Erreur temporaire du système', requestId);
    
  } finally {
    // Nettoyage et analytics finaux
    const processingTime = Date.now() - requestStart;
    logRequestCompletion(requestId, processingTime);
  }
}

// 🔍 VALIDATION ET EXTRACTION DE LA REQUÊTE
async function validateAndExtractRequest(req, requestId) {
  try {
    const { message, options = {}, sessionId, userId } = req.body;
    
    // Validation du message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return {
        error: {
          code: 'INVALID_MESSAGE',
          message: 'Message requis et non vide'
        }
      };
    }
    
    if (message.length > 2000) {
      return {
        error: {
          code: 'MESSAGE_TOO_LONG',
          message: 'Message trop long (max 2000 caractères)'
        }
      };
    }
    
    // Génération/récupération de l'ID de session
    const finalSessionId = sessionId || generateSessionId();
    
    // Détection du contexte utilisateur
    const userContext = extractUserContext(req, options);
    
    // Construction des données validées
    return {
      message: message.trim(),
      options,
      sessionId: finalSessionId,
      userId: userId || 'anonymous',
      userContext,
      requestMetadata: {
        ip: req.ip || getClientIP(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date().toISOString(),
        requestId
      }
    };
    
  } catch (error) {
    console.error(`❌ [${requestId}] Erreur validation:`, error);
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Erreur de validation des données'
      }
    };
  }
}

// 🛡️ VÉRIFICATION DU RATE LIMITING
async function checkRateLimit(req, requestData) {
  const identifier = requestData.userId !== 'anonymous' ? requestData.userId : requestData.requestMetadata.ip;
  
  const context = {
    ip: requestData.requestMetadata.ip,
    userAgent: requestData.requestMetadata.userAgent,
    sessionId: requestData.sessionId,
    query: requestData.message,
    premiumToken: requestData.options.premiumToken,
    endpoint: 'chat'
  };
  
  return await rateLimiter.checkRateLimit(identifier, context);
}

// 🧠 TRAITEMENT PAR LE DUAL BRAIN
async function processDualBrainRequest(system, requestData, rateLimitResult) {
  const processingContext = {
    sessionId: requestData.sessionId,
    userId: requestData.userId,
    premiumToken: requestData.options.premiumToken,
    userContext: requestData.userContext,
    rateLimitInfo: rateLimitResult,
    ...requestData.requestMetadata
  };
  
  // Gestion de session pour le contexte conversationnel
  updateSessionContext(requestData.sessionId, requestData.message, processingContext);
  
  // Traitement principal par le Dual Brain
  const result = await system.processQuery(requestData.message, processingContext);
  
  // Enrichissement avec métadonnées de session
  const sessionContext = getSessionContext(requestData.sessionId);
  result.metadata = {
    ...result.metadata,
    sessionInfo: {
      messageCount: sessionContext.messageCount,
      sessionDuration: Date.now() - sessionContext.startTime,
      userEngagement: calculateUserEngagement(sessionContext)
    }
  };
  
  return result;
}

// 🎯 GESTION DU PARCOURS CONVERSION
async function handleConversionFlow(res, dualBrainResult, requestData, requestId) {
  console.log(`🎯 [${requestId}] Parcours conversion activé`);
  
  // Préparation de la réponse avec proposition premium
  const conversionResponse = {
    success: true,
    message: dualBrainResult.content,
    
    // Proposition d'upgrade premium
    premiumOffer: {
      available: true,
      title: "🚀 Accédez à notre IA Premium",
      description: dualBrainResult.premiumOffer.message,
      benefits: dualBrainResult.premiumOffer.benefits || [
        "🧠 Fusion Claude + ChatGPT",
        "🎯 Réponses ultra-précises",
        "⚡ Accès prioritaire",
        "💡 Conseils experts"
      ],
      estimatedValue: dualBrainResult.premiumOffer.estimatedValue,
      callToAction: "Obtenir l'accès premium",
      requiredFields: dualBrainResult.premiumOffer.requiredFields
    },
    
    // Métadonnées pour le frontend
    metadata: {
      requestId,
      strategy: dualBrainResult.strategy,
      confidence: dualBrainResult.metadata.confidence,
      conversionMode: true,
      sessionId: requestData.sessionId
    }
  };
  
  // Analytics de conversion
  trackConversionOpportunity(requestData, dualBrainResult);
  
  return res.status(200).json(conversionResponse);
}

// 📱 GESTION DU PARCOURS NORMAL
async function handleNormalFlow(res, dualBrainResult, requestData, requestId) {
  const isPremium = dualBrainResult.strategy?.includes('premium') || false;
  
  console.log(`📱 [${requestId}] Parcours ${isPremium ? 'premium' : 'standard'}`);
  
  // Préparation de la réponse standard
  const normalResponse = {
    success: true,
    message: dualBrainResult.content,
    
    // Informations sur la qualité de la réponse
    responseQuality: {
      strategy: dualBrainResult.strategy,
      confidence: dualBrainResult.metadata.confidence,
      aiUsed: dualBrainResult.aiUsed || 'dual_brain',
      isPremium
    },
    
    // Suggestion subtile d'upgrade (si pas premium)
    ...(isPremium ? {} : {
      hint: {
        message: "💡 Obtenez des réponses encore plus précises avec notre IA premium",
        subtle: true
      }
    }),
    
    // Métadonnées
    metadata: {
      requestId,
      sessionId: requestData.sessionId,
      responseTime: dualBrainResult.metadata.totalTime || 0,
      timestamp: new Date().toISOString()
    }
  };
  
  // Analytics de performance
  trackNormalResponse(requestData, dualBrainResult, isPremium);
  
  return res.status(200).json(normalResponse);
}

// 📊 GESTION DES SESSIONS CONVERSATIONNELLES
function updateSessionContext(sessionId, message, context) {
  if (!activeSessions.has(sessionId)) {
    activeSessions.set(sessionId, {
      startTime: Date.now(),
      messageCount: 0,
      messages: [],
      userProfile: {
        isPremium: context.premiumToken ? true : false,
        userId: context.userId,
        ip: context.ip
      }
    });
  }
  
  const session = activeSessions.get(sessionId);
  session.messageCount++;
  session.messages.push({
    timestamp: Date.now(),
    message: message.substring(0, 200), // Limite pour la mémoire
    context: {
      userAgent: context.userAgent,
      ip: context.ip
    }
  });
  
  // Nettoyage automatique des anciennes sessions
  if (session.messages.length > 10) {
    session.messages = session.messages.slice(-5); // Garder seulement les 5 derniers
  }
}

function getSessionContext(sessionId) {
  return activeSessions.get(sessionId) || {
    startTime: Date.now(),
    messageCount: 0,
    messages: []
  };
}

function calculateUserEngagement(sessionContext) {
  const duration = Date.now() - sessionContext.startTime;
  const messageFrequency = sessionContext.messageCount / Math.max(duration / 60000, 1); // Messages par minute
  
  let engagement = 'low';
  if (messageFrequency > 2 || sessionContext.messageCount > 5) {
    engagement = 'high';
  } else if (messageFrequency > 1 || sessionContext.messageCount > 2) {
    engagement = 'medium';
  }
  
  return {
    level: engagement,
    messageCount: sessionContext.messageCount,
    durationMinutes: Math.round(duration / 60000),
    frequency: Math.round(messageFrequency * 100) / 100
  };
}

// 📈 ANALYTICS ET TRACKING
function trackConversionOpportunity(requestData, dualBrainResult) {
  const opportunity = {
    sessionId: requestData.sessionId,
    userId: requestData.userId,
    message: requestData.message.substring(0, 100),
    confidence: dualBrainResult.metadata.opportunity?.confidence || 0,
    estimatedValue: dualBrainResult.premiumOffer?.estimatedValue || 0,
    timestamp: Date.now()
  };
  
  // Log pour analytics (en production, envoyez vers votre système d'analytics)
  console.log(`🎯 Opportunité conversion:`, {
    sessionId: opportunity.sessionId,
    confidence: opportunity.confidence,
    estimatedValue: opportunity.estimatedValue
  });
}

function trackNormalResponse(requestData, dualBrainResult, isPremium) {
  const response = {
    sessionId: requestData.sessionId,
    strategy: dualBrainResult.strategy,
    confidence: dualBrainResult.metadata.confidence,
    isPremium,
    responseTime: dualBrainResult.metadata.totalTime || 0,
    timestamp: Date.now()
  };
  
  // Mise à jour des revenus si premium
  if (isPremium) {
    globalStats.premiumConversions++;
    // Estimation de revenus (en production, calculez précisément)
    globalStats.revenueGenerated += estimateRevenueFromPremiumUsage(response);
  }
  
  console.log(`📊 Réponse trackée:`, {
    strategy: response.strategy,
    isPremium: response.isPremium,
    confidence: response.confidence
  });
}

// 🔧 UTILITAIRES

function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

function configureCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID');
}

function extractUserContext(req, options) {
  return {
    device: detectDevice(req.headers['user-agent']),
    location: extractLocation(req),
    referrer: req.headers.referer,
    language: req.headers['accept-language']?.split(',')[0] || 'fr',
    premium: options.premiumToken ? true : false,
    returning: options.sessionId ? true : false
  };
}

function detectDevice(userAgent) {
  if (!userAgent) return 'unknown';
  
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function extractLocation(req) {
  // En production, utilisez un service de géolocalisation IP
  return {
    country: req.headers['cf-ipcountry'] || 'FR',
    city: req.headers['cf-ipcity'] || 'unknown'
  };
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

function updatePeakConcurrency() {
  const currentConcurrency = activeSessions.size;
  if (currentConcurrency > globalStats.peakConcurrency) {
    globalStats.peakConcurrency = currentConcurrency;
  }
}

function estimateRevenueFromPremiumUsage(response) {
  // Estimation basée sur la complexité de la réponse et la qualité
  const baseValue = 0.10; // 10 centimes par requête premium
  const qualityMultiplier = response.confidence > 0.8 ? 1.5 : 1.0;
  const complexityMultiplier = response.responseTime > 5000 ? 1.3 : 1.0;
  
  return baseValue * qualityMultiplier * complexityMultiplier;
}

// 🚨 GESTION D'ERREURS STANDARDISÉE

function respondWithError(res, status, code, message, requestId) {
  console.error(`❌ [${requestId}] Erreur ${status}: ${code} - ${message}`);
  
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      requestId,
      timestamp: new Date().toISOString()
    }
  });
}

function respondWithRateLimit(res, rateLimitResult, requestId) {
  console.warn(`⚠️ [${requestId}] Rate limit: ${rateLimitResult.message}`);
  
  return res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: rateLimitResult.message,
      retryAfter: rateLimitResult.retryAfter,
      limits: rateLimitResult.limits,
      upgradeAvailable: rateLimitResult.upgradeAvailable,
      requestId
    }
  });
}

// 📊 ENDPOINT DE MONITORING (bonus)
export async function systemStatus(req, res) {
  if (req.method === 'GET' && req.url === '/api/chat/status') {
    const uptime = Date.now() - globalStats.systemUptime;
    
    return res.status(200).json({
      status: 'operational',
      uptime: Math.round(uptime / 1000),
      stats: globalStats,
      activeSessions: activeSessions.size,
      system: {
        memory: process.memoryUsage(),
        version: '1.0.0'
      },
      timestamp: new Date().toISOString()
    });
  }
}

function logRequestCompletion(requestId, processingTime) {
  console.log(`✅ [${requestId}] Complété en ${processingTime}ms`);
  
  // Nettoyage des sessions inactives (>30 min)
  const thirtyMinutesAgo = Date.now() - 1800000;
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.startTime < thirtyMinutesAgo) {
      activeSessions.delete(sessionId);
    }
  }
}
