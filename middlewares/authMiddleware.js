// middlewares/authMiddleware.js
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // التحقق من وجود جلسة مستخدم
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }

    // جلب بيانات المستخدم مع حقل role مهم للتحقق من صلاحياته لاحقًا
    const user = await User.findById(req.session.userId).select('username avatar bookmarks role');
    if (!user) {
      return res.redirect('/auth/login');
    }

    // حفظ بيانات المستخدم في req.user للاستعمال في باقي الطلب
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.redirect('/auth/login');
  }
};

module.exports = auth;
