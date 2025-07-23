// routes/notifications.js

const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middlewares/authMiddleware');

router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('user', 'username avatar')
      .populate('post', '_id caption') 
      .sort({ createdAt: -1 });

    res.render('notifications', { notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).send('An error occurred while fetching notifications.');
  }
});

router.post('/mark-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.redirect('/notifications');
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).send('Error marking notifications as read');
  }
});

module.exports = router;
