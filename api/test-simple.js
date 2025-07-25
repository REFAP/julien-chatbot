// api/test-simple.js
// Test ultra-simple pour vérifier que les endpoints fonctionnent

export default async function handler(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: "Endpoint test fonctionne !",
      method: req.method,
      timestamp: new Date().toISOString(),
      body: req.body
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
