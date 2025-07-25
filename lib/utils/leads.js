// lib/utils/leads.js
// Système de Lead Generation pour partenaires auto - Business Model Premium

import { config, detectNeedType, calculateLeadValue } from './config.js';
import fs from 'fs';
import path from 'path';

export class LeadGenerationSystem {
  constructor() {
    this.leadsFile = path.join(process.cwd(), 'data', 'leads.json');
    this.dailyStats = new Map();
  }

  // 🎯 DÉTECTION D'OPPORTUNITÉ - Analyse si la conversation mérite un upgrade premium
  analyzeOpportunity(conversation, userQuery, aiResponse) {
    const analysis = {
      shouldTriggerUpgrade: false,
      confidence: 0,
      detectedNeed: null,
      triggerReasons: [],
      potentialValue: 0
    };

    // 1. Analyse des mots-clés déclencheurs
    const triggerMatch = this.checkAutoTriggers(userQuery);
    if (triggerMatch.found) {
      analysis.confidence += 0.4;
      analysis.triggerReasons.push(`Mot-clé détecté: ${triggerMatch.keywords.join(', ')}`);
    }

    // 2. Détection du type de besoin et partenaire potentiel
    const needType = detectNeedType(userQuery + ' ' + aiResponse.content);
    if (needType) {
      analysis.detectedNeed = needType;
      analysis.confidence += 0.3;
      analysis.potentialValue = config.partners[needType.partner]?.leadValue || 0;
      analysis.triggerReasons.push(`Besoin ${needType.specialite} détecté (${needType.partner})`);
    }

    // 3. Analyse de la qualité de la réponse IA
    if (aiResponse.metadata?.confidence > 0.7) {
      analysis.confidence += 0.2;
      analysis.triggerReasons.push('Réponse IA de haute qualité');
    }

    // 4. Détection d'urgence dans la conversation
    const urgency = this.detectUrgency(userQuery);
    if (urgency.score > 0.5) {
      analysis.confidence += 0.1;
      analysis.potentialValue *= 1.3; // Bonus urgence
      analysis.triggerReasons.push(`Urgence détectée: ${urgency.indicators.join(', ')}`);
    }

    // Décision finale
    analysis.shouldTriggerUpgrade = analysis.confidence >= config.leadGeneration.qualityThreshold;

    return analysis;
  }

  // 🔍 Vérification des mots-clés déclencheurs
  checkAutoTriggers(text) {
    const lowerText = text.toLowerCase();
    const foundKeywords = config.leadGeneration.autoTriggers.filter(keyword => 
      lowerText.includes(keyword)
    );

    return {
      found: foundKeywords.length > 0,
      keywords: foundKeywords,
      score: foundKeywords.length / config.leadGeneration.autoTriggers.length
    };
  }

  // ⚡ Détection d'urgence dans le message
  detectUrgency(text) {
    const lowerText = text.toLowerCase();
    const urgencyIndicators = config.leadScoring.urgencyKeywords.filter(keyword =>
      lowerText.includes(keyword)
    );

    return {
      score: urgencyIndicators.length > 0 ? Math.min(urgencyIndicators.length * 0.3, 1.0) : 0,
      indicators: urgencyIndicators
    };
  }

  // 💎 GÉNÉRATION DU MESSAGE PREMIUM - Propose l'upgrade de manière naturelle
  generateUpgradeMessage(opportunity) {
    const baseMessage = config.premiumAccess.upgradeMessage;
    
    let customMessage = baseMessage.intro + '\n\n' + baseMessage.offer;

    // Personnalisation selon le besoin détecté
    if (opportunity.detectedNeed) {
      const partner = config.partners[opportunity.detectedNeed.partner];
      customMessage += `\n\n🎯 Spécialement optimisé pour vos questions sur: ${opportunity.detectedNeed.specialite}`;
      
      if (partner && partner.active) {
        customMessage += `\n💡 Nous travaillons avec ${partner.name} pour vous offrir les meilleurs conseils.`;
      }
    }

    // Ajout des bénéfices
    customMessage += '\n\n' + baseMessage.benefits.join('\n');

    // Call-to-action adapté à l'urgence
    if (opportunity.confidence > 0.8) {
      customMessage += '\n\n🚀 Accès immédiat en 30 secondes - Quelques infos rapides suffisent !';
    } else {
      customMessage += '\n\n✨ Voulez-vous essayer notre IA premium ?';
    }

    return {
      message: customMessage,
      showDataForm: true,
      requiredFields: config.leadGeneration.requiredData,
      estimatedValue: opportunity.potentialValue
    };
  }

  // 📝 COLLECTE ET VALIDATION DES DONNÉES UTILISATEUR
  async collectUserData(userData, conversationContext) {
    // Validation des données requises
    const validation = this.validateUserData(userData);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Données incomplètes',
        missingFields: validation.missingFields
      };
    }

    // Enrichissement des données avec le contexte
    const enrichedData = await this.enrichLeadData(userData, conversationContext);

    // Sauvegarde du lead
    const lead = await this.saveLead(enrichedData);

    // Distribution aux partenaires pertinents
    await this.distributeToPartners(lead);

    return {
      success: true,
      leadId: lead.id,
      premiumAccess: this.generatePremiumToken(lead.id),
      message: '🎉 Parfait ! Vous avez maintenant accès à notre IA premium pendant 30 jours !'
    };
  }

  // ✅ Validation des données utilisateur
  validateUserData(userData) {
    const missing = config.leadGeneration.requiredData.filter(field => 
      !userData[field] || userData[field].trim() === ''
    );

    return {
      valid: missing.length === 0,
      missingFields: missing,
      completeness: (config.leadGeneration.requiredData.length - missing.length) / config.leadGeneration.requiredData.length
    };
  }

  // 🔍 Enrichissement des données avec contexte et scoring
  async enrichLeadData(userData, context) {
    const now = new Date();
    
    // Détection du besoin principal
    const needType = detectNeedType(context.conversation || '');
    
    // Scoring de l'urgence et du budget
    const urgencyScore = this.detectUrgency(context.conversation || '');
    const budgetMentioned = this.detectBudgetMention(context.conversation || '');

    // Calcul du score global du lead
    const leadScore = this.calculateLeadScore({
      urgency: urgencyScore.score,
      budget: budgetMentioned ? 1 : 0,
      localisation: userData.ville ? 1 : 0,
      contact: userData.telephone ? 1 : 0
    });

    return {
      id: this.generateLeadId(),
      timestamp: now.toISOString(),
      
      // Données utilisateur
      nom: userData.nom,
      email: userData.email,
      telephone: userData.telephone || null,
      ville: userData.ville,
      besoin_auto: userData.besoin_auto,
      
      // Contexte enrichi
      conversation_snippet: (context.conversation || '').substring(0, 500),
      detected_need: needType,
      urgency_score: urgencyScore.score,
      urgency_indicators: urgencyScore.indicators,
      budget_mentioned: budgetMentioned,
      
      // Scoring et valeur
      lead_score: leadScore,
      estimated_value: needType ? calculateLeadValue(userData, needType) : 0,
      
      // Métadonnées
      source: 'dual_brain_chat',
      user_agent: context.userAgent || 'unknown',
      ip_hash: context.ipHash || null,
      session_id: context.sessionId || null,
      
      // Statut
      status: 'new',
      premium_access_granted: true,
      premium_expires: new Date(now.getTime() + config.premiumAccess.freeAccessDuration).toISOString()
    };
  }

  // 📊 Calcul du score de qualité du lead
  calculateLeadScore(factors) {
    const weights = config.leadScoring.weights;
    
    return Object.entries(factors).reduce((score, [factor, value]) => {
      const weight = weights[factor] || 0;
      return score + (value * weight);
    }, 0);
  }

  // 💰 Détection de mention de budget
  detectBudgetMention(text) {
    const lowerText = text.toLowerCase();
    return config.leadScoring.budgetKeywords.some(keyword => 
      lowerText.includes(keyword)
    );
  }

  // 💾 Sauvegarde du lead dans le fichier JSON
  async saveLead(leadData) {
    try {
      // Lecture des leads existants
      let leads = [];
      if (fs.existsSync(this.leadsFile)) {
        const data = fs.readFileSync(this.leadsFile, 'utf8');
        leads = JSON.parse(data);
      }

      // Ajout du nouveau lead
      leads.push(leadData);

      // Sauvegarde
      fs.writeFileSync(this.leadsFile, JSON.stringify(leads, null, 2));

      console.log(`💎 Nouveau lead sauvegardé: ${leadData.email} (score: ${leadData.lead_score})`);
      
      return leadData;
    } catch (error) {
      console.error('❌ Erreur sauvegarde lead:', error);
      throw error;
    }
  }

  // 🤝 DISTRIBUTION AUX PARTENAIRES
  async distributeToPartners(lead) {
    if (!lead.detected_need) return;

    const partner = config.partners[lead.detected_need.partner];
    if (!partner || !partner.active || !partner.webhook) return;

    try {
      // Préparation des données pour le partenaire
      const partnerData = {
        lead_id: lead.id,
        timestamp: lead.timestamp,
        contact: {
          nom: lead.nom,
          email: lead.email,
          telephone: lead.telephone,
          ville: lead.ville
        },
        besoin: {
          type: lead.detected_need.specialite,
          description: lead.besoin_auto,
          urgence: lead.urgency_score,
          budget_mentioned: lead.budget_mentioned
        },
        scoring: {
          lead_score: lead.lead_score,
          estimated_value: lead.estimated_value
        },
        source: 'dual_brain_premium'
      };

      // Envoi webhook au partenaire
      const response = await fetch(partner.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET,
          'X-Partner': partner.name
        },
        body: JSON.stringify(partnerData)
      });

      if (response.ok) {
        console.log(`✅ Lead envoyé à ${partner.name}: ${lead.email}`);
        
        // Mise à jour du statut
        await this.updateLeadStatus(lead.id, 'sent_to_partner', {
          partner: partner.name,
          sent_at: new Date().toISOString()
        });
      } else {
        console.error(`❌ Échec envoi à ${partner.name}:`, response.status);
      }

    } catch (error) {
      console.error(`💥 Erreur distribution ${partner.name}:`, error.message);
    }
  }

  // 🔄 Mise à jour du statut d'un lead
  async updateLeadStatus(leadId, newStatus, metadata = {}) {
    try {
      const data = fs.readFileSync(this.leadsFile, 'utf8');
      const leads = JSON.parse(data);
      
      const leadIndex = leads.findIndex(lead => lead.id === leadId);
      if (leadIndex !== -1) {
        leads[leadIndex].status = newStatus;
        leads[leadIndex].last_updated = new Date().toISOString();
        leads[leadIndex] = { ...leads[leadIndex], ...metadata };
        
        fs.writeFileSync(this.leadsFile, JSON.stringify(leads, null, 2));
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour lead:', error);
    }
  }

  // 🎫 Génération du token d'accès premium
  generatePremiumToken(leadId) {
    const tokenData = {
      leadId,
      grantedAt: Date.now(),
      expiresAt: Date.now() + config.premiumAccess.freeAccessDuration
    };
    
    // Token simple (en production, utilisez JWT avec signature)
    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }

  // 🔍 Vérification du token premium
  validatePremiumToken(token) {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      return Date.now() < tokenData.expiresAt;
    } catch {
      return false;
    }
  }

  // 📈 ANALYTICS ET STATISTIQUES
  async getAnalytics() {
    try {
      const data = fs.readFileSync(this.leadsFile, 'utf8');
      const leads = JSON.parse(data);
      
      const now = new Date();
      const today = now.toDateString();
      const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;
      
      return {
        total_leads: leads.length,
        today: leads.filter(lead => new Date(lead.timestamp).toDateString() === today).length,
        this_month: leads.filter(lead => {
          const leadDate = new Date(lead.timestamp);
          return `${leadDate.getFullYear()}-${leadDate.getMonth()}` === thisMonth;
        }).length,
        average_score: leads.reduce((sum, lead) => sum + lead.lead_score, 0) / leads.length,
        total_estimated_value: leads.reduce((sum, lead) => sum + lead.estimated_value, 0),
        by_partner: this.groupLeadsByPartner(leads),
        conversion_rate: this.calculateConversionRate(leads)
      };
    } catch {
      return { error: 'Aucune donnée disponible' };
    }
  }

  // 📊 Groupement des leads par partenaire
  groupLeadsByPartner(leads) {
    const grouped = {};
    
    leads.forEach(lead => {
      if (lead.detected_need?.partner) {
        const partner = lead.detected_need.partner;
        if (!grouped[partner]) {
          grouped[partner] = { count: 0, total_value: 0 };
        }
        grouped[partner].count++;
        grouped[partner].total_value += lead.estimated_value;
      }
    });
    
    return grouped;
  }

  // 📈 Calcul du taux de conversion
  calculateConversionRate(leads) {
    const sent = leads.filter(lead => lead.status === 'sent_to_partner').length;
    return leads.length > 0 ? (sent / leads.length * 100).toFixed(1) : 0;
  }

  // 🆔 Génération d'ID unique pour les leads
  generateLeadId() {
    return 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  }
}

export default LeadGenerationSystem;
