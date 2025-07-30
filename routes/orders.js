const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('../models/User'); // تأكد أن هذا هو موديل المستخدم
const auth = require('../middlewares/authMiddleware');
const Notification = require('../models/Notification'); // إضافة هذا السطر في الأعلى

function isAuthenticated(req, res, next) {
  if (req.user) return next();
  res.redirect('/login');
}

// إعداد الـ transporter
//const transporter = nodemailer.createTransport({
  //service: 'gmail',
  //auth: {
    //user: 'shehhddu5@gmail.com', // بريدك الذي يرسل الرسائل
    //pass: 'cihs gbzo uwno lyjm'    // كلمة مرور التطبيق (App Password) من Gmail
  //}
//});



// إرسال الطلب عبر الإيميل
let io; // سيتم ربطه لاحقاً

router.use((req, res, next) => {
  io = req.app.get('io'); // الوصول إلى io من خلال التطبيق
  next();
});

router.post('/submit-order', auth, async (req, res) => {
  const { sellerId, productName, productDescription, proposedBudget, serviceId } = req.body;
  if (!req.user) return res.status(401).json({ error: 'You must be logged in.' });

  const buyer = req.user;
  const buyerUsername = buyer.username;
  const buyerEmail = buyer.email;

  if (!productDescription?.trim()) {
    return res.status(400).json({ error: 'Please enter order details.' });
  }
  if (isNaN(proposedBudget) || proposedBudget <= 0) {
    return res.status(400).json({ error: 'Please enter a valid budget.' });
  }

  try {
    const seller = await User.findById(sellerId);
    if (!seller) return res.status(404).json({ error: 'Seller not found.' });

    // إنشاء إشعار في قاعدة البيانات
    const message = `${buyerUsername} sent a request: "${productName}".`;

    const newNotif = new Notification({
      recipient: seller._id,
      sender: buyer._id,
      type: 'request',
      message,
      data: { buyerEmail, productName, productDescription, proposedBudget, serviceId }
    });

    await newNotif.save();

    // إرسال إشعار للمشتري عبر Socket.IO
    if (io) {
      io.to(seller._id.toString()).emit('newNotification', {
        type: 'request',
        message: `${buyerUsername} has sent you a request for "${productName}".`,
        data: { buyerEmail, productName, productDescription, proposedBudget, serviceId }
      });
    }

    return res.status(200).json({ message: 'Request sent successfully.' });
  } catch (err) {
    console.error('Order Error:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});
// راوت لعرض الطلبات (لو كنت تحتاجه مستقبلاً)
router.get('/notification/:nid', auth, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.nid)
      .populate('sender', 'username')
      .populate('recipient', 'username')
      .lean(); // لجعل البيانات عادية يمكن استخدامها مباشرة في EJS

    if (!notif) {
      return res.status(404).send('Notification not found (invalid ID)');
    }

    // تأكد أن المستخدم الحالي هو المستلم
    if (notif.recipient._id.toString() !== req.user._id.toString()) {
      return res.status(403).send('You are not authorized to view this notification.');
    }

    // تحديث حالة القراءة إن لم تكن مقروءة
    if (!notif.isRead) {
      await Notification.findByIdAndUpdate(req.params.nid, { isRead: true });
    }

    res.render('orderDetail', { notification: notif });
  } catch (err) {
    console.error('Error fetching notification:', err);
    res.status(500).send('An error occurred while fetching the notification.');
  }
});


// ✅ راوت اختياري لعرض الطلبات (غير مهم حالياً)
router.get('/', auth, async (req, res) => {
  res.send('This route will show orders.');
});

module.exports = router;
