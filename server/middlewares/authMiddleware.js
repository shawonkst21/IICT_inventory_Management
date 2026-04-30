const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  //console.log('User:', req.user);
  if (req.user.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireEvaluator = (req, res, next) => {
  if (req.user.userRole !== 'evaluator') {
    return res.status(403).json({ error: 'Evaluator access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireEvaluator };