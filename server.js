const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!message || !session_id) {
      return res.status(400).json({
        success: false,
        error: 'Message and session_id are required'
      });
    }

    // Get or create session
    let session = await getOrCreateSession(session_id);

    // Process the message
    const response = await processMessage(message, session);

    // Update session in database
    await updateSession(session_id, response.sessionUpdate);

    // Save message to chat history
    await saveChatMessage(session_id, 'user', message);
    await saveChatMessage(session_id, 'assistant', response.response);

    res.json({
      success: true,
      response: response.response,
      confidence: response.confidence,
      top_causes: response.topCauses,
      ctas: response.ctas,
      session_state: response.sessionState,
      current_progress: response.progress,
      question_type: response.questionType,
      options: response.options,
      recommended_workflow: response.recommendedWorkflow
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Database helper functions
async function getOrCreateSession(sessionId) {
  try {
    const { data, error } = await supabase
      .from('diagnostic_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Session doesn't exist, create it
      const { data: newSession, error: createError } = await supabase
        .from('diagnostic_sessions')
        .insert([{ 
          session_id: sessionId,
          state: 'initial',
          collected_signals: {},
          current_scores: {},
          user_data: {},
          current_progress: 0
        }])
        .select()
        .single();

      if (createError) throw createError;
      return newSession;
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Session error:', error);
    throw error;
  }
}

async function updateSession(sessionId, updates) {
  try {
    const { error } = await supabase
      .from('diagnostic_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('Update session error:', error);
    throw error;
  }
}

async function saveChatMessage(sessionId, sender, message) {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        sender: sender,
        message: message,
        metadata: {}
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Save message error:', error);
    throw error;
  }
}

// Message processing logic
async function processMessage(message, session) {
  const currentState = session.state || 'initial';
  const collectedSignals = session.collected_signals || {};
  const currentScores = session.current_scores || {};
  
  // Analyze message for symptoms
  const symptoms = extractSymptoms(message);
  
  // Update signals
  const updatedSignals = {
    ...collectedSignals,
    ...symptoms
  };
  
  // Calculate diagnostic scores
  const scores = calculateScores(updatedSignals);
  
  // Determine next action
  const nextAction = determineNextAction(scores, currentState);
  
  // Generate response
  const response = generateResponse(nextAction, scores);
  
  // Calculate progress
  const progress = calculateProgress(updatedSignals);
  
  return {
    response: response.text,
    confidence: response.confidence,
    topCauses: response.topCauses,
    ctas: response.ctas,
    sessionState: nextAction.newState,
    progress: progress,
    questionType: response.questionType,
    options: response.options,
    recommendedWorkflow: response.workflow,
    sessionUpdate: {
      state: nextAction.newState,
      collected_signals: updatedSignals,
      current_scores: scores,
      current_progress: progress
    }
  };
}

// Symptom extraction
function extractSymptoms(message) {
  const symptoms = {};
  const lowerMessage = message.toLowerCase();
  
  // Check for smoke symptoms
  if (lowerMessage.includes('fumée noire') || lowerMessage.includes('fumee noire')) {
    symptoms.smoke_color = 'black';
  } else if (lowerMessage.includes('fumée blanche') || lowerMessage.includes('fumee blanche')) {
    symptoms.smoke_color = 'white';
  } else if (lowerMessage.includes('fumée bleue') || lowerMessage.includes('fumee bleue')) {
    symptoms.smoke_color = 'blue';
  }
  
  // Check for power loss
  if (lowerMessage.includes('perte de puissance') || lowerMessage.includes('perte puissance')) {
    symptoms.power_loss = true;
  }
  
  // Check for warning lights
  if (lowerMessage.includes('voyant') || lowerMessage.includes('témoin')) {
    symptoms.warning_light = true;
  }
  
  // Check for error codes
  const errorCodeMatch = lowerMessage.match(/p[0-9]{4}/);
  if (errorCodeMatch) {
    symptoms.error_code = errorCodeMatch[0].toUpperCase();
  }
  
  return symptoms;
}

// Score calculation
function calculateScores(signals) {
  const scores = {
    clogged_filter: 0,
    sensor_failure: 0,
    additive_issue: 0,
    regeneration_needed: 0
  };
  
  // Calculate based on symptoms
  if (signals.smoke_color === 'black') {
    scores.clogged_filter += 0.3;
  }
  
  if (signals.power_loss) {
    scores.clogged_filter += 0.25;
    scores.regeneration_needed += 0.2;
  }
  
  if (signals.warning_light) {
    scores.sensor_failure += 0.2;
    scores.clogged_filter += 0.15;
  }
  
  if (signals.error_code) {
    const code = signals.error_code;
    if (code === 'P2002' || code === 'P2003') {
      scores.clogged_filter += 0.4;
    } else if (code === 'P2452' || code === 'P2453') {
      scores.sensor_failure += 0.4;
    }
  }
  
  // Normalize scores
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const key in scores) {
      scores[key] = scores[key] / total;
    }
  }
  
  return scores;
}

// Determine next action
function determineNextAction(scores, currentState) {
  const topScore = Math.max(...Object.values(scores));
  const topCause = Object.keys(scores).find(key => scores[key] === topScore);
  
  if (currentState === 'initial' && topScore < 0.5) {
    return {
      action: 'collect_more_info',
      newState: 'collecting_symptoms'
    };
  }
  
  if (topScore >= 0.7) {
    return {
      action: 'provide_diagnosis',
      newState: 'diagnosis_complete',
      diagnosis: topCause
    };
  }
  
  return {
    action: 'ask_clarifying_question',
    newState: 'collecting_symptoms'
  };
}

// Generate response
function generateResponse(action, scores) {
  const response = {
    text: '',
    confidence: 0,
    topCauses: [],
    ctas: [],
    questionType: null,
    options: null,
    workflow: null
  };
  
  // Sort causes by score
  const sortedCauses = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([cause, score]) => ({
      name: getCauseName(cause),
      score: score,
      description: getCauseDescription(cause)
    }));
  
  response.topCauses = sortedCauses.slice(0, 3);
  response.confidence = sortedCauses[0].score;
  
  switch (action.action) {
    case 'collect_more_info':
      response.text = "Pour mieux diagnostiquer votre problème FAP, j'ai besoin de quelques informations supplémentaires. Pouvez-vous me dire si vous observez l'un de ces symptômes ?";
      response.questionType = 'multiple_choice';
      response.options = [
        { id: 'black_smoke', label: 'Fumée noire à l\'échappement' },
        { id: 'power_loss', label: 'Perte de puissance' },
        { id: 'warning_light', label: 'Voyant moteur allumé' },
        { id: 'high_consumption', label: 'Consommation excessive' }
      ];
      break;
      
    case 'provide_diagnosis':
      response.text = `D'après mon analyse, votre problème principal semble être : **${getCauseName(action.diagnosis)}**\n\nVoici ce que je recommande :`;
      response.workflow = getRecommendedWorkflow(action.diagnosis);
      response.ctas = [
        {
          type: 'primary',
          title: '🔧 Commencer le traitement',
          action: `start_${action.diagnosis}_treatment`
        },
        {
          type: 'professional',
          title: '👨‍🔧 Contacter un professionnel',
          action: 'contact_expert'
        }
      ];
      break;
      
    case 'ask_clarifying_question':
      response.text = "J'ai besoin d'un peu plus d'informations. Depuis combien de temps observez-vous ces symptômes ?";
      response.questionType = 'open';
      break;
  }
  
  return response;
}

// Helper functions
function getCauseName(cause) {
  const names = {
    clogged_filter: 'FAP encrassé',
    sensor_failure: 'Défaillance capteur',
    additive_issue: 'Problème d\'additif',
    regeneration_needed: 'Régénération nécessaire'
  };
  return names[cause] || cause;
}

function getCauseDescription(cause) {
  const descriptions = {
    clogged_filter: 'Le filtre à particules est obstrué par la suie',
    sensor_failure: 'Un capteur du système FAP ne fonctionne pas correctement',
    additive_issue: 'Le niveau d\'additif FAP est insuffisant',
    regeneration_needed: 'Le FAP a besoin d\'une régénération forcée'
  };
  return descriptions[cause] || '';
}

function getRecommendedWorkflow(diagnosis) {
  const workflows = {
    clogged_filter: {
      name: 'Nettoyage FAP',
      category: 'professional',
      success_probability: 0.85,
      steps: [
        { step: 1, title: 'Diagnostic complet', instructions: 'Vérification des codes erreur et état du FAP' },
        { step: 2, title: 'Nettoyage chimique', instructions: 'Application du produit nettoyant Re-Fap' },
        { step: 3, title: 'Régénération forcée', instructions: 'Cycle de régénération à haute température' }
      ]
    },
    regeneration_needed: {
      name: 'Régénération autoroute',
      category: 'self_service',
      success_probability: 0.75,
      steps: [
        { step: 1, title: 'Préparation', instructions: 'Vérifier niveau carburant > 1/4' },
        { step: 2, title: 'Trajet autoroute', instructions: 'Rouler 30-45 min à 90-110 km/h' },
        { step: 3, title: 'Vérification', instructions: 'Contrôler disparition des symptômes' }
      ]
    }
  };
  return workflows[diagnosis] || null;
}

function calculateProgress(signals) {
  const totalPossibleSignals = 10; // Nombre total de signaux qu'on peut collecter
  const collectedSignals = Object.keys(signals).length;
  return Math.min(Math.round((collectedSignals / totalPossibleSignals) * 100), 90);
}

// For Vercel, we need to export the app
module.exports = app;

// Only listen if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
