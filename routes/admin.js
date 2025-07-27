const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const User = require('../models/User');
const Post = require('../models/Posts');

// لو تستخدم ميدلوير isAdmin ولم تعد تريدها هنا (لأنها لوحة المستخدم فقط) يمكنك حذفها
// هنا افترضنا فقط auth حتى يتمكن المستخدم من الدخول فقط

router.get('/dashboard', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    // جلب منشورات المستخدم فقط مع التعليقات
    const userPosts = await Post.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'comments.user',
        select: 'username',
      });

    // إذا في مكان تحتفظ فيه بالإجراءات الأخيرة recentActions (يمكن حفظها في user أو مكان آخر)
    // مثلا: currentUser.recentActions
    // لو مش موجودة نرسل مصفوفة فارغة
    const recentActions = currentUser.recentActions || [];

    res.render('admin/dashboard', {
      layout: false,
      currentUser,
      posts: userPosts,          // اسم المتغير posts متوافق مع الصفحة
      userPosts,                 // ممكن تستعمله لو في الصفحة (عندك تحقق شرط userPosts.length)
      recentActions,
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
