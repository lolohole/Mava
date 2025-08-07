const express = require('express');
const router = express.Router();
const User = require('../models/User'); // تأكد أن لديك موديل User
const jwt = require('jsonwebtoken');

// تسجيل مستخدم جديد
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // تحقق إن كان المستخدم موجود مسبقًا
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // حفظ المستخدم بدون تشفير
    const newUser = new User({
      username,
      email,
      password // بدون تشفير
      // role: 'user' ← إذا كنت تستخدمه، احذفه الآن
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // التحقق من وجود المستخدم
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // مقارنة كلمة المرور مباشرة (بدون تشفير)
    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // إنشاء توكن
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
        // role: user.role ← لا حاجة له إذا شلت الـ role
      },
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
