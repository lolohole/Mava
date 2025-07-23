const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const chatController = require('../controllers/chatController'); // استيراد المتحكم الذي أنشأته

// تأكد أن المستخدم مسجّل دخول
router.use((req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
});
router.get('/chat/:userId', chatController.showChat);
// صفحة الدردشة مع مستخدم معين
router.get('/chat/:otherUserId', async (req, res) => {
  try {
    const currentUser = req.user;
    const otherUserId = req.params.otherUserId;

    const otherUser = await User.findById(otherUserId);
    if (!otherUser) return res.status(404).send('User not found');

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUser._id, otherUser._id] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUser._id, otherUser._id],
        createdAt: new Date()
      });
    }

    const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });

    res.render('chat', {
      user: currentUser,
      otherUser,
      conversation,
      messages
    });

  } catch (err) {
    console.error('❌ Chat loading error:', err);
    res.status(500).send('A server error occurred.');
  }
});


module.exports = router;
