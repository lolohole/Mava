const User = require('../models/User');
const generateUniqueUserCode = require('../utils/generateUserCode');
const useragent = require('express-useragent');

const authMiddleware = async (req, res, next) => {
  try {
    // Allow public routes without authentication
    const openPaths = ['/auth/login', '/auth/register'];
    if (openPaths.includes(req.path)) {
      return next();
    }

    // Check if session exists
    if (!req.session || !req.session.userId) {
      return res.redirect('/auth/login');
    }

    // Fetch user with role
    //let user = await User.findById(req.session.userId).populate('rolle');
    //if (!user) {
      //return res.redirect('/auth/login');
    //}

    // Check user status (prevent banned or inactive users from accessing)
    if (user.status === 'banned' || user.status === 'inactive') {
      return res.status(403).send('Access denied: Your account is inactive or banned.');
    }

    // Generate a unique userCode if it doesn't exist
    if (!user.userCode) {
      const newCode = await generateUniqueUserCode();
      await User.updateOne({ _id: user._id }, { $set: { userCode: newCode } });
      user = await User.findById(req.session.userId).populate('rolle'); // refresh user
    }

    // Check for device or IP consistency (optional security enhancement)
    const currentIp = req.ip;
    const currentUserAgent = req.headers['user-agent'];

    if (!req.session.userAgent) {
      req.session.userAgent = currentUserAgent;
      req.session.userIp = currentIp;
    } else {
      if (
        req.session.userAgent !== currentUserAgent ||
        req.session.userIp !== currentIp
      ) {
        return res.status(403).send('Suspicious activity detected: New device or location.');
      }
    }

    // Attach user to request object
    req.user = user;

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(500).send(`An authentication error occurred: ${err.message}`);
  }
};

module.exports = authMiddleware;

