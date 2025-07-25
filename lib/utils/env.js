// lib/utils/env.js
// Mapping des variables d'environnement pour correspondre à votre config Vercel

export const getEnvConfig = () => {
  return {
    // Mapping exact vers vos variables Vercel existantes
    openai: {
      apiKey: process.env.CLE_API_OPENAI, // Votre variable Vercel exacte
      organization: process.env.OPENAI_ORG_ID,
      baseURL: 'https://api.openai.com/v1'
    },
    
    anthropic: {
      apiKey: process.env.CLAUDE_API_KEY, // Votre variable Vercel exacte
      baseURL: 'https://api.anthropic.com'
    },
    
    // Autres configs business
    business: {
      webhookSecret: process.env.WEBHOOK_SECRET,
      leadsSecretKey: process.env.LEADS_SECRET_KEY,
      analyticsToken: process.env.ANALYTICS_TOKEN
    },
    
    // Config partenaires (si vous en avez)
    partners: {
      midasApiKey: process.env.MIDAS_API_KEY,
      idgaragesApiKey: process.env.IDGARAGES_API_KEY,
      carterCashApiKey: process.env.CARTER_CASH_API_KEY,
      yakaroulerApiKey: process.env.YAKAROULER_API_KEY
    }
  };
};

// Validation des clés obligatoires
export const validateEnvironment = () => {
  const config = getEnvConfig();
  const errors = [];
  const warnings = [];
  
  // Vérification OpenAI avec votre variable exacte
  if (!config.openai.apiKey) {
    errors.push('Clé OpenAI manquante (CLE_API_OPENAI)');
  } else if (!config.openai.apiKey.startsWith('sk-')) {
    errors.push('Format de clé OpenAI invalide (doit commencer par sk-)');
  }
  
  // Vérification Anthropic/Claude avec votre variable exacte
  if (!config.anthropic.apiKey) {
    errors.push('Clé Claude manquante (CLAUDE_API_KEY)');
  } else if (!config.anthropic.apiKey.startsWith('sk-ant-')) {
    errors.push('Format de clé Claude invalide (doit commencer par sk-ant-)');
  }
  
  // Vérifications business (optionnelles)
  if (!config.business.webhookSecret) {
    warnings.push('WEBHOOK_SECRET manquante (recommandée pour la sécurité)');
  }
  
  if (!config.business.leadsSecretKey) {
    warnings.push('LEADS_SECRET_KEY manquante (nécessaire pour les revenus)');
  }
  
  return {
    isValid: errors.length === 0,
    config,
    errors,
    warnings
  };
};

// Helper pour debug
export const getEnvironmentDebugInfo = () => {
  const config = getEnvConfig();
  
  return {
    environment: process.env.NODE_ENV || 'development',
    platform: process.env.VERCEL_ENV || 'local',
    
    // Status des clés (sans exposer les valeurs)
    keys: {
      openai: {
        configured: !!config.openai.apiKey,
        source: 'CLE_API_OPENAI', // Votre variable Vercel exacte
        length: config.openai.apiKey?.length || 0,
        prefix: config.openai.apiKey?.substring(0, 8) + '...' || 'non configurée'
      },
      
      anthropic: {
        configured: !!config.anthropic.apiKey,
        source: 'CLAUDE_API_KEY', // Votre variable Vercel exacte
        length: config.anthropic.apiKey?.length || 0,
        prefix: config.anthropic.apiKey?.substring(0, 12) + '...' || 'non configurée'
      },
      
      business: {
        webhook: !!config.business.webhookSecret,
        leads: !!config.business.leadsSecretKey
      }
    }
  };
};
