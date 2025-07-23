const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.use((req, res, next) => {
  if (!req.user) return res.redirect('/login');
  next();
});

// بدل `listConversations` بـ `list`
router.get('/conversations', chatController.list);

// بدل `showChat` بـ `show`
router.get('/chat/:userId', chatController.show);

module.exports = router;
