// middlewares/authMiddleware.js
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.session.userId).select('username avatar bookmarks');
    if (!user) {
      return res.redirect('/auth/login');
    }

    req.user = user; // تخزين المستخدم في req.user مع حقل bookmarks
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.redirect('/auth/login');
  }
};
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = auth;
