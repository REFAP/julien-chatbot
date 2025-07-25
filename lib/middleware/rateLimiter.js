// lib/middleware/rateLimiter.js
// Rate Limiter Avancé - Protection du business model et optimisation des coûts

import { config } from '../utils/config.js';

export class AdvancedRateLimiter {
  constructor() {
    // Stockage en mémoire des limites (en production, utilisez Redis)
    this.userLimits = new Map();
    this.ipLimits = new Map();
    this.premiumUsers = new Set();
    this.suspiciousIPs = new Set();
    
    // Analytics et monitoring
    this.analytics = {
      totalRequests: 0,
      blockedRequests: 0,
      premiumRequests: 0,
      suspiciousActivity: 0,
      peakUsage: 0,
      costSaving: 0
    };
    
    // Configuration des limites
    this.limits = {
      standard: {
        requestsPerMinute: 5,
        requestsPerHour: 50,
        requestsPerDay: 200,
        burstLimit: 3,
        cooldownMinutes: 5
      },
      premium: {
        requestsPerMinute: 20,
        requestsPerHour: 300,
        requestsPerDay: 1000,
        burstLimit: 10,
        cooldownMinutes: 1
      },
      suspicious: {
        requestsPerMinute: 1,
        requestsPerHour: 5,
        requestsPerDay: 10,
        burstLimit: 1,
        cooldownMinutes: 30
      }
    };
    
    // Nettoyage automatique des données anciennes
    setInterval(() => this.cleanup(), 60000); // Chaque minute
    
    console.log('🛡️ Rate Limiter Avancé initialisé - Protection business activée');
  }

  // 🛡️ VÉRIFICATION PRINCIPALE - Point d'entrée de la protection
  async checkRateLimit(identifier, context = {}) {
    const now = Date.now();
    this.analytics.totalRequests++;
    
    try {
      // 1. Identification de l'utilisateur
      const userProfile = this.identifyUser(identifier, context);
      
      // 2. Détection d'activité suspecte
      const suspicionLevel = this.detectSuspiciousActivity(userProfile, context);
      
      // 3. Sélection des limites appropriées
      const applicableLimits = this.selectLimits(userProfile, suspicionLevel);
      
      // 4. Vérification des limites
      const limitCheck = this.checkLimits(userProfile, applicableLimits, now);
      
      // 5. Gestion du résultat
      if (limitCheck.allowed) {
        this.recordAllowedRequest(userProfile, context, now);
        return this.createSuccessResponse(limitCheck, userProfile);
      } else {
        this.recordBlockedRequest(userProfile, context, limitCheck, now);
        return this.createBlockedResponse(limitCheck, userProfile);
      }
      
    } catch (error) {
      console.error('❌ Erreur Rate Limiter:', error);
      // En cas d'erreur, on bloque par sécurité
      return this.createErrorResponse(error);
    }
  }

  // 👤 IDENTIFICATION DE L'UTILISATEUR
  identifyUser(identifier, context) {
    const profile = {
      id: identifier,
      ip: context.ip || 'unknown',
      userAgent: context.userAgent || 'unknown',
      sessionId: context.sessionId || null,
      isPremium: this.isPremiumUser(identifier, context),
      isNewUser: !this.userLimits.has(identifier),
      timestamp: Date.now()
    };
    
    // Enrichissement du profil
    if (context.premiumToken) {
      profile.premiumValidated = this.validatePremiumToken(context.premiumToken);
      if (profile.premiumValidated) {
        profile.isPremium = true;
        this.premiumUsers.add(identifier);
      }
    }
    
    return profile;
  }

  // 🔍 DÉTECTION D'ACTIVITÉ SUSPECTE
  detectSuspiciousActivity(userProfile, context) {
    let suspicionScore = 0;
    const reasons = [];
    
    // 1. Vérification de l'IP
    if (this.suspiciousIPs.has(userProfile.ip)) {
      suspicionScore += 0.5;
      reasons.push('ip_blacklisted');
    }
    
    // 2. Pattern de requêtes anormal
    const userHistory = this.getUserHistory(userProfile.id);
    if (userHistory.requests.length > 0) {
      const recentRequests = userHistory.requests.filter(req => 
        Date.now() - req.timestamp < 60000 // Dernière minute
      );
      
      if (recentRequests.length > 10) {
        suspicionScore += 0.3;
        reasons.push('burst_pattern');
      }
      
      // Requêtes identiques répétées
      const identicalQueries = this.countIdenticalQueries(recentRequests);
      if (identicalQueries > 3) {
        suspicionScore += 0.4;
        reasons.push('identical_queries');
      }
    }
    
    // 3. User-Agent suspect
    if (this.isSuspiciousUserAgent(userProfile.userAgent)) {
      suspicionScore += 0.2;
      reasons.push('suspicious_user_agent');
    }
    
    // 4. Géolocalisation anormale (si disponible)
    if (context.country && this.isHighRiskCountry(context.country)) {
      suspicionScore += 0.1;
      reasons.push('high_risk_location');
    }
    
    // 5. Absence de JavaScript (bot probable)
    if (context.noJS) {
      suspicionScore += 0.3;
      reasons.push('no_javascript');
    }
    
    return {
      score: Math.min(suspicionScore, 1.0),
      level: suspicionScore > 0.7 ? 'high' : suspicionScore > 0.4 ? 'medium' : 'low',
      reasons
    };
  }

  // ⚖️ SÉLECTION DES LIMITES APPROPRIÉES
  selectLimits(userProfile, suspicionLevel) {
    // Utilisateur premium vérifié
    if (userProfile.isPremium && userProfile.premiumValidated) {
      this.analytics.premiumRequests++;
      return this.limits.premium;
    }
    
    // Activité suspecte détectée
    if (suspicionLevel.score > 0.6) {
      this.analytics.suspiciousActivity++;
      this.suspiciousIPs.add(userProfile.ip);
      return this.limits.suspicious;
    }
    
    // Utilisateur standard
    return this.limits.standard;
  }

  // 🔒 VÉRIFICATION DES LIMITES
  checkLimits(userProfile, limits, now) {
    const userId = userProfile.id;
    const userHistory = this.getUserHistory(userId);
    
    // Filtrage des requêtes par période
    const minuteRequests = userHistory.requests.filter(req => now - req.timestamp < 60000);
    const hourRequests = userHistory.requests.filter(req => now - req.timestamp < 3600000);
    const dayRequests = userHistory.requests.filter(req => now - req.timestamp < 86400000);
    
    // Vérification des limites
    const checks = {
      minute: {
        current: minuteRequests.length,
        limit: limits.requestsPerMinute,
        exceeded: minuteRequests.length >= limits.requestsPerMinute
      },
      hour: {
        current: hourRequests.length,
        limit: limits.requestsPerHour,
        exceeded: hourRequests.length >= limits.requestsPerHour
      },
      day: {
        current: dayRequests.length,
        limit: limits.requestsPerDay,
        exceeded: dayRequests.length >= limits.requestsPerDay
      },
      burst: {
        current: this.countRecentBurst(userHistory.requests, now),
        limit: limits.burstLimit,
        exceeded: this.countRecentBurst(userHistory.requests, now) >= limits.burstLimit
      }
    };
    
    // Vérification du cooldown
    const lastBlocked = userHistory.lastBlocked;
    const cooldownActive = lastBlocked && (now - lastBlocked) < (limits.cooldownMinutes * 60000);
    
    // Détermination si la requête est autorisée
    const anyExceeded = Object.values(checks).some(check => check.exceeded);
    const allowed = !anyExceeded && !cooldownActive;
    
    return {
      allowed,
      checks,
      cooldownActive,
      cooldownRemaining: cooldownActive ? Math.ceil((limits.cooldownMinutes * 60000 - (now - lastBlocked)) / 1000) : 0,
      limitType: this.determineLimitType(checks)
    };
  }

  // 📊 GESTION DES HISTORIQUES UTILISATEUR
  getUserHistory(userId) {
    if (!this.userLimits.has(userId)) {
      this.userLimits.set(userId, {
        requests: [],
        firstSeen: Date.now(),
        lastBlocked: null,
        totalRequests: 0,
        totalBlocked: 0,
        isPremium: false
      });
    }
    return this.userLimits.get(userId);
  }

  // ✅ ENREGISTREMENT REQUÊTE AUTORISÉE
  recordAllowedRequest(userProfile, context, timestamp) {
    const userHistory = this.getUserHistory(userProfile.id);
    
    userHistory.requests.push({
      timestamp,
      query: context.query?.substring(0, 100) || 'unknown',
      ip: userProfile.ip,
      userAgent: userProfile.userAgent,
      allowed: true
    });
    
    userHistory.totalRequests++;
    userHistory.isPremium = userProfile.isPremium;
    
    // Mise à jour des statistiques globales
    this.updatePeakUsage();
  }

  // ❌ ENREGISTREMENT REQUÊTE BLOQUÉE
  recordBlockedRequest(userProfile, context, limitCheck, timestamp) {
    const userHistory = this.getUserHistory(userProfile.id);
    
    userHistory.requests.push({
      timestamp,
      query: context.query?.substring(0, 100) || 'unknown',
      ip: userProfile.ip,
      userAgent: userProfile.userAgent,
      allowed: false,
      blockReason: limitCheck.limitType
    });
    
    userHistory.totalBlocked++;
    userHistory.lastBlocked = timestamp;
    
    // Mise à jour des statistiques globales
    this.analytics.blockedRequests++;
    this.calculateCostSaving(userProfile.isPremium);
  }

  // 💰 CALCUL DES ÉCONOMIES RÉALISÉES
  calculateCostSaving(isPremium) {
    // Estimation du coût d'une requête Dual Brain
    const costPerRequest = isPremium ? 0.08 : 0.05; // Premium coûte plus cher
    this.analytics.costSaving += costPerRequest;
  }

  // 📈 MISE À JOUR DU PIC D'USAGE
  updatePeakUsage() {
    const currentMinute = Math.floor(Date.now() / 60000);
    const currentRequests = Array.from(this.userLimits.values())
      .reduce((total, user) => {
        return total + user.requests.filter(req => 
          Math.floor(req.timestamp / 60000) === currentMinute
        ).length;
      }, 0);
    
    if (currentRequests > this.analytics.peakUsage) {
      this.analytics.peakUsage = currentRequests;
    }
  }

  // 🎯 RÉPONSES FORMATÉES

  createSuccessResponse(limitCheck, userProfile) {
    return {
      allowed: true,
      remaining: {
        minute: limitCheck.checks.minute.limit - limitCheck.checks.minute.current - 1,
        hour: limitCheck.checks.hour.limit - limitCheck.checks.hour.current - 1,
        day: limitCheck.checks.day.limit - limitCheck.checks.day.current - 1
      },
      resetTimes: {
        minute: Date.now() + 60000,
        hour: Date.now() + 3600000,
        day: Date.now() + 86400000
      },
      userType: userProfile.isPremium ? 'premium' : 'standard',
      message: userProfile.isPremium ? 
        '💎 Accès premium - Limites étendues' : 
        '📱 Accès standard - Passez premium pour plus de requêtes'
    };
  }

  createBlockedResponse(limitCheck, userProfile) {
    const blockedBy = limitCheck.limitType;
    const isNewUser = userProfile.isNewUser;
    
    let message = '⚠️ Limite de requêtes atteinte. ';
    let upgradeHint = '';
    
    if (blockedBy === 'minute') {
      message += 'Veuillez patienter 1 minute avant votre prochaine requête.';
    } else if (blockedBy === 'hour') {
      message += 'Limite horaire atteinte.';
      upgradeHint = userProfile.isPremium ? '' : ' 💡 Les utilisateurs premium ont 6x plus de requêtes !';
    } else if (blockedBy === 'day') {
      message += 'Limite quotidienne atteinte.';
      upgradeHint = userProfile.isPremium ? '' : ' 🚀 Passez premium pour 5x plus de requêtes quotidiennes !';
    } else if (blockedBy === 'burst') {
      message += 'Trop de requêtes simultanées.';
    } else if (limitCheck.cooldownActive) {
      message += `Période de refroidissement active (${limitCheck.cooldownRemaining}s restantes).`;
    }
    
    return {
      allowed: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: message + upgradeHint,
      retryAfter: this.calculateRetryAfter(limitCheck),
      limits: limitCheck.checks,
      cooldown: limitCheck.cooldownActive ? limitCheck.cooldownRemaining : 0,
      upgradeAvailable: !userProfile.isPremium,
      isNewUser
    };
  }

  createErrorResponse(error) {
    return {
      allowed: false,
      error: 'RATE_LIMITER_ERROR',
      message: 'Erreur temporaire du système de protection. Veuillez réessayer.',
      retryAfter: 60
    };
  }

  // 🔧 UTILITAIRES

  isPremiumUser(identifier, context) {
    return this.premiumUsers.has(identifier) || 
           (context.premiumToken && this.validatePremiumToken(context.premiumToken));
  }

  validatePremiumToken(token) {
    try {
      // Validation simplifiée (en production, utilisez JWT)
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      return Date.now() < tokenData.expiresAt;
    } catch {
      return false;
    }
  }

  countRecentBurst(requests, now) {
    // Compte les requêtes dans les 10 dernières secondes
    return requests.filter(req => now - req.timestamp < 10000).length;
  }

  countIdenticalQueries(requests) {
    const queries = requests.map(req => req.query);
    const queryCount = {};
    
    queries.forEach(query => {
      queryCount[query] = (queryCount[query] || 0) + 1;
    });
    
    return Math.max(...Object.values(queryCount), 0);
  }

  isSuspiciousUserAgent(userAgent) {
    const suspiciousPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i,
      /postman/i, /insomnia/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  isHighRiskCountry(country) {
    // Liste simplifiée de pays à risque élevé pour le spam
    const highRiskCountries = ['XX', 'ZZ']; // Codes anonymes
    return highRiskCountries.includes(country);
  }

  determineLimitType(checks) {
    if (checks.burst.exceeded) return 'burst';
    if (checks.minute.exceeded) return 'minute';
    if (checks.hour.exceeded) return 'hour';
    if (checks.day.exceeded) return 'day';
    return 'none';
  }

  calculateRetryAfter(limitCheck) {
    if (limitCheck.cooldownActive) return limitCheck.cooldownRemaining;
    if (limitCheck.checks.minute.exceeded) return 60;
    if (limitCheck.checks.hour.exceeded) return 3600;
    if (limitCheck.checks.day.exceeded) return 86400;
    return 60; // Default
  }

  // 🧹 NETTOYAGE AUTOMATIQUE
  cleanup() {
    const now = Date.now();
    const dayAgo = now - 86400000;
    
    let cleanedUsers = 0;
    let cleanedRequests = 0;
    
    // Nettoyage des historiques utilisateur
    for (const [userId, userHistory] of this.userLimits.entries()) {
      // Suppression des requêtes anciennes
      const oldRequestCount = userHistory.requests.length;
      userHistory.requests = userHistory.requests.filter(req => req.timestamp > dayAgo);
      cleanedRequests += oldRequestCount - userHistory.requests.length;
      
      // Suppression des utilisateurs inactifs depuis 7 jours
      if (userHistory.requests.length === 0 && (now - userHistory.firstSeen) > 604800000) {
        this.userLimits.delete(userId);
        cleanedUsers++;
      }
    }
    
    // Nettoyage des IPs suspectes (reset après 24h)
    for (const ip of this.suspiciousIPs) {
      const ipData = this.getIPData(ip);
      if (ipData && (now - ipData.firstFlagged) > 86400000) {
        this.suspiciousIPs.delete(ip);
      }
    }
    
    if (cleanedUsers > 0 || cleanedRequests > 0) {
      console.log(`🧹 Nettoyage: ${cleanedUsers} utilisateurs, ${cleanedRequests} requêtes anciennes supprimées`);
    }
  }

  getIPData(ip) {
    // Méthode simplifiée pour obtenir les données IP
    return { firstFlagged: Date.now() - 43200000 }; // 12h ago par défaut
  }

  // 📊 ANALYTICS ET MONITORING

  getAnalytics() {
    const now = Date.now();
    
    return {
      ...this.analytics,
      activeUsers: this.userLimits.size,
      premiumUsers: this.premiumUsers.size,
      suspiciousIPs: this.suspiciousIPs.size,
      conversionRate: this.analytics.totalRequests > 0 ? 
        (this.analytics.premiumRequests / this.analytics.totalRequests * 100).toFixed(1) : 0,
      blockRate: this.analytics.totalRequests > 0 ? 
        (this.analytics.blockedRequests / this.analytics.totalRequests * 100).toFixed(1) : 0,
      costSavingUSD: (this.analytics.costSaving).toFixed(2),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  // 🎯 MÉTHODES PREMIUM

  upgradeToPremium(userId, premiumToken) {
    if (this.validatePremiumToken(premiumToken)) {
      this.premiumUsers.add(userId);
      const userHistory = this.getUserHistory(userId);
      userHistory.isPremium = true;
      
      console.log(`💎 Utilisateur ${userId} upgradé en premium`);
      return true;
    }
    return false;
  }

  // 🚨 MÉTHODES D'ADMINISTRATION

  blockIP(ip, reason = 'manual') {
    this.suspiciousIPs.add(ip);
    console.log(`🚫 IP ${ip} bloquée: ${reason}`);
  }

  unblockIP(ip) {
    this.suspiciousIPs.delete(ip);
    console.log(`✅ IP ${ip} débloquée`);
  }

  resetUserLimits(userId) {
    if (this.userLimits.has(userId)) {
      this.userLimits.delete(userId);
      console.log(`🔄 Limites utilisateur ${userId} reset`);
      return true;
    }
    return false;
  }

  // 🔍 DIAGNOSTIC

  diagnoseUser(userId) {
    const userHistory = this.getUserHistory(userId);
    const now = Date.now();
    
    return {
      userId,
      isPremium: userHistory.isPremium,
      totalRequests: userHistory.totalRequests,
      totalBlocked: userHistory.totalBlocked,
      successRate: userHistory.totalRequests > 0 ? 
        ((userHistory.totalRequests - userHistory.totalBlocked) / userHistory.totalRequests * 100).toFixed(1) : 100,
      recentActivity: userHistory.requests.filter(req => now - req.timestamp < 3600000).length,
      lastActivity: userHistory.requests.length > 0 ? 
        new Date(userHistory.requests[userHistory.requests.length - 1].timestamp).toISOString() : 'never',
      accountAge: Math.floor((now - userHistory.firstSeen) / 86400000) + ' days'
    };
  }
}

export default AdvancedRateLimiter;
