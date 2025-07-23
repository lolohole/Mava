const express = require('express');
const router = express.Router();
const Campaign = require('../models/campaign');
const User = require('../models/User');  // تعديل المسار حسب الحاجة
const authMiddleware = require('../middlewares/authMiddleware'); // تأكد من المسار الصحي

router.get('/profile/:id', authMiddleware, async (req, res) => {
  try {
    const profileUser = await User.findById(req.params.id);  // جلب بيانات المستخدم بناءً على id
    if (!profileUser) return res.status(404).send('User not found');

    // إذا كانت الخصوصية "private" وكان المستخدم لا يملك الإذن لرؤية الحساب
    if (profileUser.privacy === 'private' && String(profileUser._id) !== String(req.user._id)) {
      const viewer = await User.findById(req.user._id);
      const isFollowing = viewer?.following?.some(f => String(f) === String(profileUser._id));
      if (!isFollowing) return res.render('private-account', { user: profileUser });
    }

    // جلب الحملات الخاصة بالمستخدم
    const campaigns = await Campaign.find({ creator: profileUser._id });  // جلب الحملات الخاصة بالمستخدم المعين
    const user = req.user;  // المستخدم الحالي

    // عرض الحملات كجزء من صفحة البروفايل (وليس صفحة الحملات)
    res.render('profile-campaigns', { campaigns, user, profileUser });  // عرض القالب الذي يعرض الحملات في صفحة البروفايل
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});


module.exports = router;
