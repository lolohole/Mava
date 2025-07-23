const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerUsername: { type: String, required: true },
  sellerUsername: { type: String, required: true },

  productName: { type: String, required: true },          // اسم المنتج
  productDescription: { type: String, required: true },   // وصف المنتج المطلوب (في الفورم: details)
  proposedBudget: { type: Number, required: true },       // الميزانية المقترحة (في الفورم: budget)

  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' },
});

module.exports = mongoose.model('Order', orderSchema);
