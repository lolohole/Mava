// models/Notification.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ✅ مهم لـ populate
    data: { type: mongoose.Schema.Types.Mixed }, // أضف هذا السطر

  type: { type: String, enum: ['request', 'message', 'delete','like', 'comment', 'follow', 'order' , 'unsave' , 'save' ,  'edit' , 'share', 'add'   ], required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
