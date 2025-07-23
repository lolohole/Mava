const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  companyName: String,
  campaignName: String,
  startDate: Date,
  endDate: Date,
  targetAudience: [String],
  discountCode: String,
  description: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // الربط مع نموذج المستخدم
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;  // تأكد من تصدير النموذج بشكل صحيح
