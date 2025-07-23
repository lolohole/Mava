const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const messageSchema = new mongoose.Schema({
  sender: { type: ObjectId, required: true },
  receiver: { type: ObjectId, required: true },
  conversation: { type: ObjectId, required: true },
  message: { type: String, required: true },
  sentimentScore: { type: Number },
  emotion: { type: String }, // ✅ إضافة هذا السطر

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
