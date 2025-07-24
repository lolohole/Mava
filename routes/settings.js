const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// عرض الإعدادات
router.get('/',  async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect('/login');

    res.render('profile-settings', { user  ,   layout: false,
 });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load settings');
  }
});

// تحديث بيانات المستخدم الأساسية
// تحديث الإعدادات لتشمل الخلفية
router.post('/', async (req, res) => {
  const { fullName, username, bio, website, email, phone, gender  } = req.body;
  try {
    // تحديث البيانات في قاعدة البيانات مع الخلفية
    await User.findByIdAndUpdate(req.session.userId, {
      fullName, username, bio, website, email, phone, gender 
    });
    res.redirect('/settings');
  } catch (err) {
    console.error(err);
    res.status(500).send(' Update failed');
  }
});


// تحديث الخصوصية
// تحديث الخصوصية
router.post('/privacy', async (req, res) => {
  const { privacy } = req.body;
  if (!['public', 'private'].includes(privacy)) {
    return res.status(400).send('The privacy value is invalid');
  }
  try {
    await User.findByIdAndUpdate(req.session.userId, { privacy });
    res.redirect('/settings');
  } catch (err) {
    console.error(err);
    res.status(500).send('Privacy update failed');
  }
});


// تغيير كلمة المرور
router.post('/password',  async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (newPassword !== confirmNewPassword) {
    return res.status(400).send('Passwords do not match');
  }
  try {
    const user = await User.findById(req.session.userId);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).send('Current passwords are incorrect.');
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.redirect('/settings');
  } catch (err) {
    console.error(err);
    res.status(500).send('Password change failed');
  }
});
router.get('/notifications', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render('/notifications', { user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// تحديث إعدادات الإشعارات (POST)
router.post('/notifications', async (req, res) => {
  try {
    const { likes, comments, newFollowers } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, {
      notifications: {
        likes: likes === 'true',
        comments: comments === 'true',
        newFollowers: newFollowers === 'true'
      }
    });

    res.redirect('/notifications');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while updating notifications.');
  }
});

// تعطيل الحساب
router.post('/disable',  async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.session.userId, { disabled: true });
    req.session.destroy(() => res.redirect('/goodbye'));
  } catch (err) {
    console.error(err);
    res.status(500).send('Account deactivation failed');
  }
});

// حذف الحساب
router.post('/delete',  async (req, res) => {
  try {
    await User.findByIdAndDelete(req.session.userId);
    req.session.destroy(() => res.redirect('/goodbye'));
  } catch (err) {
    console.error(err);
    res.status(500).send('Account deletion failed');
  }
});

// عرض معلومات المستخدم
router.get('/profile/:userId', async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.session.userId); // الحصول على المستخدم الحالي
    const profileUser = await User.findById(req.params.userId); // الحصول على المستخدم المطلوب
    if (!profileUser) return res.status(404).send('User not found');

    // التحقق من إعدادات الخصوصية
    if (profileUser.privacy === 'private' && req.session.userId !== profileUser._id.toString()) {
      // إذا كان الحساب خاصًا، والطلب لم يكن من المستخدم نفسه
      return res.status(403).send('The account is private, you cannot see the data.');
    }

    // إذا كانت الخصوصية عامة أو الحساب هو حساب المستخدم نفسه
    res.render('profile', { user: profileUser });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while loading the page.');
  }
});

module.exports = router;
