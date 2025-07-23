const express = require('express');
const User = require('../models/User');
const router = express.Router();

// صفحة التسجيل
router.get('/register', (req, res) => {
  res.render('register');
});

// تنفيذ التسجيل
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.redirect('/auth/login');
  } catch (err) {
    res.status(500).send('Error while registering the account');
  }
});

// صفحة تسجيل الدخول
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// تنفيذ تسجيل الدخول
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { error: 'Email not registered' });
    }
    if (user.password !== password) {
      return res.render('login', { error: 'The password is incorrect' });
    }

    // حفظ المستخدم في الجلسة بدلاً من JWT
    req.session.userId = user._id;

    res.redirect('/users/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('A server error occurred while logging in.');
  }
});

// تسجيل الخروج
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
