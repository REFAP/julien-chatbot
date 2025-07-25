export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: "🚀 Test réussi ! Le système Vercel fonctionne parfaitement.",
    timestamp: new Date().toISOString(),
    method: req.method
  });
}
