// api/leads.js
// API Leads Business - Transformation des conversations en revenus

import LeadGenerationSystem from '../lib/utils/leads.js';
import AdvancedRateLimiter from '../lib/middleware/rateLimiter.js';
import { config } from '../lib/utils/config.js';

// Initialisation des systèmes
const leadSystem = new LeadGenerationSystem();
const rateLimiter = new AdvancedRateLimiter();

// Cache pour optimiser les performances
const analyticsCache = new Map();
let lastCacheUpdate = 0;

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    // CORS pour les appels depuis votre frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Rate limiting intelligent
    const clientId = req.headers['x-user-id'] || req.ip || 'anonymous';
    const rateLimitResult = await rateLimiter.checkRateLimit(clientId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      endpoint: 'leads'
    });

    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message,
        retryAfter: rateLimitResult.retryAfter
      });
    }

    // Routing selon la méthode et le endpoint
    switch (req.method) {
      case 'POST':
        return await handleLeadSubmission(req, res);
      
      case 'GET':
        return await handleAnalytics(req, res);
      
      default:
        return res.status(405).json({
          success: false,
          error: 'METHOD_NOT_ALLOWED',
          message: 'Méthode non supportée'
        });
    }

  } catch (error) {
    console.error('💥 Erreur API Leads:', error);
    
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur interne temporaire',
      requestId: generateRequestId()
    });
  }
}

// 💎 SOUMISSION DE LEAD - Conversion utilisateur en prospect payant
async function handleLeadSubmission(req, res) {
  console.log('💎 Nouvelle soumission de lead...');
  
  try {
    // Validation des données entrantes
    const validation = validateLeadData(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DATA',
        message: 'Données incomplètes ou invalides',
        details: validation.errors,
        missingFields: validation.missingFields
      });
    }

    const {
      userData,
      conversationContext,
      sessionId,
      source = 'dual_brain_upgrade'
    } = req.body;

    // Enrichissement du contexte avec métadonnées
    const enrichedContext = {
      ...conversationContext,
      sessionId,
      source,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    };

    // Traitement par le système de lead generation
    const leadResult = await leadSystem.collectUserData(userData, enrichedContext);

    if (leadResult.success) {
      // Lead créé avec succès
      console.log(`✅ Lead créé: ${userData.email} (ID: ${leadResult.leadId})`);
      
      // Calcul de la valeur business pour analytics
      const businessValue = await calculateBusinessValue(leadResult.leadId);
      
      // Réponse de succès avec token premium
      return res.status(201).json({
        success: true,
        message: leadResult.message,
        leadId: leadResult.leadId,
        premiumAccess: {
          token: leadResult.premiumAccess,
          expiresIn: config.premiumAccess.freeAccessDuration,
          benefits: [
            '🧠 Accès Dual Brain (Claude + ChatGPT)',
            '🎯 Réponses ultra-précises et créatives',
            '⚡ Priorité sur les requêtes',
            '💡 Conseils experts personnalisés'
          ]
        },
        analytics: {
          estimatedValue: businessValue.estimated,
          partnerMatch: businessValue.partner,
          conversionSuccess: true
        }
      });

    } else {
      // Échec de création du lead
      console.warn(`⚠️ Échec lead: ${userData.email} - ${leadResult.error}`);
      
      return res.status(400).json({
        success: false,
        error: 'LEAD_CREATION_FAILED',
        message: leadResult.error,
        suggestions: generateErrorSuggestions(leadResult.error)
      });
    }

  } catch (error) {
    console.error('❌ Erreur soumission lead:', error);
    
    return res.status(500).json({
      success: false,
      error: 'LEAD_PROCESSING_ERROR',
      message: 'Erreur lors du traitement de votre demande',
      retryable: true
    });
  }
}

// 📊 ANALYTICS ET DASHBOARD - Monitoring des performances business
async function handleAnalytics(req, res) {
  try {
    const { timeframe = '24h', detailed = false } = req.query;
    
    // Vérification des permissions (simple token pour la démo)
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken || authToken !== process.env.ANALYTICS_TOKEN) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Token d\'accès analytics requis'
      });
    }

    // Cache pour éviter les recalculs coûteux
    const cacheKey = `analytics_${timeframe}_${detailed}`;
    const now = Date.now();
    
    if (analyticsCache.has(cacheKey) && (now - lastCacheUpdate) < 300000) { // 5 min cache
      return res.status(200).json({
        success: true,
        cached: true,
        data: analyticsCache.get(cacheKey)
      });
    }

    // Génération des analytics complètes
    const analytics = await generateComprehensiveAnalytics(timeframe, detailed);
    
    // Mise en cache
    analyticsCache.set(cacheKey, analytics);
    lastCacheUpdate = now;

    return res.status(200).json({
      success: true,
      timeframe,
      data: analytics,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur analytics:', error);
    
    return res.status(500).json({
      success: false,
      error: 'ANALYTICS_ERROR',
      message: 'Erreur lors de la génération des analytics'
    });
  }
}

// ✅ VALIDATION DES DONNÉES DE LEAD
function validateLeadData(body) {
  const errors = [];
  const missingFields = [];

  if (!body) {
    return {
      valid: false,
      errors: ['Corps de requête manquant'],
      missingFields: ['body']
    };
  }

  const { userData, conversationContext } = body;

  // Validation userData
  if (!userData) {
    missingFields.push('userData');
    errors.push('Données utilisateur manquantes');
  } else {
    // Champs obligatoires selon la config
    config.leadGeneration.requiredData.forEach(field => {
      if (!userData[field] || userData[field].trim() === '') {
        missingFields.push(`userData.${field}`);
        errors.push(`Champ obligatoire manquant: ${field}`);
      }
    });

    // Validation email
    if (userData.email && !isValidEmail(userData.email)) {
      errors.push('Format email invalide');
    }

    // Validation téléphone (si fourni)
    if (userData.telephone && !isValidPhone(userData.telephone)) {
      errors.push('Format téléphone invalide');
    }
  }

  // Validation conversationContext
  if (!conversationContext) {
    missingFields.push('conversationContext');
    errors.push('Contexte de conversation manquant');
  }

  return {
    valid: errors.length === 0,
    errors,
    missingFields
  };
}

// 💰 CALCUL DE LA VALEUR BUSINESS D'UN LEAD
async function calculateBusinessValue(leadId) {
  try {
    // Récupération des données du lead
    const leadData = await getLeadData(leadId);
    if (!leadData) {
      return { estimated: 0, partner: null };
    }

    // Détection du partenaire optimal
    const partnerMatch = leadData.detected_need;
    if (!partnerMatch) {
      return { estimated: 0, partner: null };
    }

    const partner = config.partners[partnerMatch.partner];
    if (!partner || !partner.active) {
      return { estimated: 0, partner: null };
    }

    // Calcul de la valeur avec bonus qualité
    let baseValue = partner.leadValue;
    
    // Bonus selon les critères de qualité
    const qualityMultipliers = {
      hasPhone: leadData.telephone ? 1.2 : 1.0,
      highUrgency: leadData.urgency_score > 0.7 ? 1.3 : 1.0,
      budgetMentioned: leadData.budget_mentioned ? 1.15 : 1.0,
      localInfo: leadData.ville ? 1.1 : 1.0
    };

    const totalMultiplier = Object.values(qualityMultipliers).reduce((acc, mult) => acc * mult, 1);
    const estimatedValue = Math.round(baseValue * totalMultiplier);

    console.log(`💰 Valeur calculée: ${estimatedValue}€ pour ${partner.name}`);

    return {
      estimated: estimatedValue,
      partner: partner.name,
      baseValue,
      qualityMultipliers,
      leadScore: leadData.lead_score
    };

  } catch (error) {
    console.error('❌ Erreur calcul valeur:', error);
    return { estimated: 0, partner: null };
  }
}

// 📊 GÉNÉRATION D'ANALYTICS COMPLÈTES
async function generateComprehensiveAnalytics(timeframe, detailed) {
  try {
    // Analytics de base du système de leads
    const baseAnalytics = await leadSystem.getAnalytics();
    
    // Analytics du rate limiter
    const rateLimiterAnalytics = rateLimiter.getAnalytics();
    
    // Calculs de revenus
    const revenueAnalytics = await calculateRevenueAnalytics(timeframe);
    
    // Performance par partenaire
    const partnerPerformance = await analyzePartnerPerformance(timeframe);
    
    // Tendances de conversion
    const conversionTrends = await analyzeConversionTrends(timeframe);

    const analytics = {
      // Vue d'ensemble business
      overview: {
        totalLeads: baseAnalytics.total_leads || 0,
        totalRevenue: revenueAnalytics.total,
        averageLeadValue: revenueAnalytics.average,
        conversionRate: baseAnalytics.conversion_rate || 0,
        activePartners: Object.keys(config.partners).filter(p => config.partners[p].active).length
      },

      // Performance système
      system: {
        uptime: rateLimiterAnalytics.uptime,
        totalRequests: rateLimiterAnalytics.totalRequests,
        blockedRequests: rateLimiterAnalytics.blockedRequests,
        premiumUsers: rateLimiterAnalytics.premiumUsers,
        costSavingUSD: rateLimiterAnalytics.costSavingUSD
      },

      // Revenue breakdown
      revenue: {
        ...revenueAnalytics,
        projections: calculateRevenueProjections(revenueAnalytics)
      },

      // Performance par partenaire
      partners: partnerPerformance,

      // Tendances et insights
      trends: conversionTrends,

      // Métriques détaillées (si demandées)
      ...(detailed ? await getDetailedMetrics(timeframe) : {})
    };

    return analytics;

  } catch (error) {
    console.error('❌ Erreur génération analytics:', error);
    return { error: 'Impossible de générer les analytics' };
  }
}

// 💵 CALCUL DES REVENUS PAR PÉRIODE
async function calculateRevenueAnalytics(timeframe) {
  try {
    const leads = await getAllLeads();
    const timeFilter = getTimeFilter(timeframe);
    
    const filteredLeads = leads.filter(lead => {
      const leadTime = new Date(lead.timestamp).getTime();
      return leadTime >= timeFilter.start && leadTime <= timeFilter.end;
    });

    const revenues = filteredLeads.map(lead => lead.estimated_value || 0);
    const total = revenues.reduce((sum, val) => sum + val, 0);
    const average = filteredLeads.length > 0 ? total / filteredLeads.length : 0;

    return {
      total: Math.round(total),
      average: Math.round(average),
      count: filteredLeads.length,
      breakdown: calculateRevenueBreakdown(filteredLeads)
    };

  } catch (error) {
    console.error('❌ Erreur calcul revenus:', error);
    return { total: 0, average: 0, count: 0, breakdown: {} };
  }
}

// 📈 ANALYSE PERFORMANCE PARTENAIRES
async function analyzePartnerPerformance(timeframe) {
  try {
    const leads = await getAllLeads();
    const timeFilter = getTimeFilter(timeframe);
    
    const performance = {};
    
    Object.keys(config.partners).forEach(partnerKey => {
      const partner = config.partners[partnerKey];
      const partnerLeads = leads.filter(lead => 
        lead.detected_need?.partner === partnerKey &&
        new Date(lead.timestamp).getTime() >= timeFilter.start
      );

      const revenue = partnerLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
      
      performance[partnerKey] = {
        name: partner.name,
        leadsCount: partnerLeads.length,
        totalRevenue: Math.round(revenue),
        averageLeadValue: partnerLeads.length > 0 ? Math.round(revenue / partnerLeads.length) : 0,
        conversionRate: calculatePartnerConversionRate(partnerKey, timeFilter),
        topSpecialties: getTopSpecialties(partnerLeads),
        active: partner.active
      };
    });

    return performance;

  } catch (error) {
    console.error('❌ Erreur analyse partenaires:', error);
    return {};
  }
}

// 📊 ANALYSE DES TENDANCES DE CONVERSION
async function analyzeConversionTrends(timeframe) {
  try {
    const leads = await getAllLeads();
    const timeFilter = getTimeFilter(timeframe);
    
    // Groupement par jour/heure selon la période
    const interval = timeframe === '24h' ? 'hour' : 'day';
    const trends = groupLeadsByInterval(leads, timeFilter, interval);
    
    // Calcul des tendances
    const trendData = Object.entries(trends).map(([time, leadsData]) => ({
      time,
      count: leadsData.length,
      revenue: leadsData.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0),
      averageScore: leadsData.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / Math.max(leadsData.length, 1)
    }));

    // Insights automatiques
    const insights = generateTrendInsights(trendData);

    return {
      data: trendData,
      insights,
      bestPerformingPeriod: findBestPeriod(trendData),
      growthRate: calculateGrowthRate(trendData)
    };

  } catch (error) {
    console.error('❌ Erreur tendances:', error);
    return { data: [], insights: [], bestPerformingPeriod: null, growthRate: 0 };
  }
}

// 🔧 UTILITAIRES

function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function generateErrorSuggestions(error) {
  const suggestions = {
    'Données incomplètes': [
      'Vérifiez que tous les champs obligatoires sont remplis',
      'L\'email doit être au format valide',
      'La ville est requise pour le matching avec nos partenaires'
    ],
    'Email invalide': [
      'Vérifiez le format de l\'email',
      'Exemple: user@example.com'
    ],
    'Téléphone invalide': [
      'Format attendu: 0123456789 ou +33123456789',
      'Le téléphone améliore la qualité du lead'
    ]
  };

  return suggestions[error] || ['Veuillez réessayer'];
}

async function getLeadData(leadId) {
  try {
    const leads = await getAllLeads();
    return leads.find(lead => lead.id === leadId) || null;
  } catch {
    return null;
  }
}

async function getAllLeads() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const leadsFile = path.join(process.cwd(), 'data', 'leads.json');
    
    if (!fs.existsSync(leadsFile)) {
      return [];
    }
    
    const data = fs.readFileSync(leadsFile, 'utf8');
    return JSON.parse(data);
    
  } catch (error) {
    console.error('❌ Erreur lecture leads:', error);
    return [];
  }
}

function getTimeFilter(timeframe) {
  const now = Date.now();
  const filters = {
    '1h': now - 3600000,
    '24h': now - 86400000,
    '7d': now - 604800000,
    '30d': now - 2592000000
  };
  
  return {
    start: filters[timeframe] || filters['24h'],
    end: now
  };
}

function calculateRevenueBreakdown(leads) {
  const breakdown = {};
  
  leads.forEach(lead => {
    const partner = lead.detected_need?.partner || 'unknown';
    if (!breakdown[partner]) {
      breakdown[partner] = { count: 0, revenue: 0 };
    }
    breakdown[partner].count++;
    breakdown[partner].revenue += lead.estimated_value || 0;
  });
  
  return breakdown;
}

function calculateRevenueProjections(revenueAnalytics) {
  const dailyAverage = revenueAnalytics.total; // Simplifié pour la démo
  
  return {
    weekly: Math.round(dailyAverage * 7),
    monthly: Math.round(dailyAverage * 30),
    yearly: Math.round(dailyAverage * 365)
  };
}

function calculatePartnerConversionRate(partnerKey, timeFilter) {
  // Calcul simplifié pour la démo
  return Math.random() * 15 + 5; // 5-20%
}

function getTopSpecialties(leads) {
  const specialties = {};
  
  leads.forEach(lead => {
    const specialty = lead.detected_need?.specialite || 'général';
    specialties[specialty] = (specialties[specialty] || 0) + 1;
  });
  
  return Object.entries(specialties)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([specialty, count]) => ({ specialty, count }));
}

function groupLeadsByInterval(leads, timeFilter, interval) {
  const groups = {};
  const intervalMs = interval === 'hour' ? 3600000 : 86400000;
  
  leads.filter(lead => {
    const leadTime = new Date(lead.timestamp).getTime();
    return leadTime >= timeFilter.start && leadTime <= timeFilter.end;
  }).forEach(lead => {
    const leadTime = new Date(lead.timestamp).getTime();
    const groupKey = Math.floor(leadTime / intervalMs) * intervalMs;
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(lead);
  });
  
  return groups;
}

function generateTrendInsights(trendData) {
  const insights = [];
  
  if (trendData.length > 1) {
    const latest = trendData[trendData.length - 1];
    const previous = trendData[trendData.length - 2];
    
    if (latest.count > previous.count) {
      insights.push(`📈 Croissance de ${latest.count - previous.count} leads par rapport à la période précédente`);
    }
    
    if (latest.revenue > previous.revenue) {
      const increase = Math.round(((latest.revenue - previous.revenue) / previous.revenue) * 100);
      insights.push(`💰 Revenus en hausse de ${increase}%`);
    }
  }
  
  // Détection des pics d'activité
  const maxCount = Math.max(...trendData.map(d => d.count));
  const peakPeriod = trendData.find(d => d.count === maxCount);
  if (peakPeriod) {
    insights.push(`🔥 Pic d'activité: ${maxCount} leads à ${new Date(parseInt(peakPeriod.time)).toLocaleString()}`);
  }
  
  return insights;
}

function findBestPeriod(trendData) {
  if (trendData.length === 0) return null;
  
  return trendData.reduce((best, current) => 
    current.revenue > best.revenue ? current : best
  );
}

function calculateGrowthRate(trendData) {
  if (trendData.length < 2) return 0;
  
  const first = trendData[0].count;
  const last = trendData[trendData.length - 1].count;
  
  return first > 0 ? Math.round(((last - first) / first) * 100) : 0;
}

async function getDetailedMetrics(timeframe) {
  return {
    userSegmentation: await analyzeUserSegmentation(timeframe),
    geographicDistribution: await analyzeGeography(timeframe),
    deviceAnalytics: await analyzeDevices(timeframe),
    conversionFunnels: await analyzeConversionFunnels(timeframe)
  };
}

// Fonctions d'analyse détaillée (simplifiées pour la démo)
async function analyzeUserSegmentation() { return { premium: 15, standard: 85 }; }
async function analyzeGeography() { return { france: 90, international: 10 }; }
async function analyzeDevices() { return { mobile: 70, desktop: 30 }; }
async function analyzeConversionFunnels() { return { steps: [] }; }
