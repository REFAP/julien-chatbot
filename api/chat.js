// api/chat.js
module.exports = (req, res) => {
  // Ne rien vérifier, juste répondre
  res.status(200).json({
    success: true,
    response: "Test - API répond",
    confidence: 0.5,
    top_causes: [],
    ctas: [],
    session_state: 'active',
    current_progress: 0
  });
};
