const express = require('express');
const User = require('../models/User');
const Role = require('../models/Role');

const router = express.Router();

// صفحة التسجيل
router.get('/register', async (req, res) => {
  try {
    const roles = await Role.find(); // جلب الأدوار لعرضها في صفحة التسجيل
    res.render('register', { roles });
  } catch (err) {
    console.error(err);
    res.status(500).send('حدث خطأ أثناء تحميل صفحة التسجيل');
  }
});

// تنفيذ التسجيل
router.post('/register', async (req, res) => {
  const { username, email, password, rolleId } = req.body;

  try {
    const rolle = await Role.findById(rolleId);
    if (!rolle) {
      return res.status(400).send('الدور المحدد غير صالح');
    }

    // توليد userCode عشوائي بسيط
    const userCode = 'U' + Math.floor(100000 + Math.random() * 900000);

    const newUser = new User({
      username,
      email,
      password,
      rolle: rolle._id, // استخدم rolle بدلًا من role
      userCode,
      interests: ['default'] // إجباري حسب المخطط
    });

    await newUser.save();
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('حدث خطأ أثناء إنشاء الحساب');
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
    const user = await User.findOne({ email }).populate('rolle');

    if (!user) {
      return res.render('login', { error: 'البريد الإلكتروني غير مسجل' });
    }

    if (user.password !== password) {
      return res.render('login', { error: 'كلمة المرور غير صحيحة' });
    }

    // حفظ المستخدم في الجلسة
    req.session.userId = user._id;

    // التوجيه حسب الدور
    const roleName = user.rolle?.name;

    if (roleName === 'admin') {
      return res.redirect('/dashboard/admin');
    } else if (roleName === 'manager') {
      return res.redirect('/dashboard/manager');
    } else if (roleName === 'hr') {
      return res.redirect('/dashboard/hr');
    } else if (roleName === 'developer') {
      return res.redirect('/dashboard/developer');
    } else if (roleName === 'sales') {
      return res.redirect('/dashboard/sales');
    } else {
      return res.redirect('/users/profile'); // إذا لم يوجد دور معروف
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('حدث خطأ أثناء تسجيل الدخول');
  }
});

// تسجيل الخروج
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
