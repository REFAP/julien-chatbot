// api/test.js - Fichier de test simple
module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'API fonctionne !',
    method: req.method,
    timestamp: new Date().toISOString()
  });
};
