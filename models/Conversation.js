const mongoose = require('mongoose');
const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: String,
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Conversation', conversationSchema);
