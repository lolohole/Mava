const express = require('express');
const router = express.Router();
const Campaign = require('../models/campaign');
const User = require('../models/User');  // تعديل المسار حسب الحاجة
const authMiddleware = require('../middlewares/authMiddleware'); // تأكد من المسار الصحيح

// عرض كل الحملات الخاصة بالمستخدم
router.get('/', authMiddleware, async (req, res) => {
  try {
    // تصفية الحملات بناءً على المستخدم الحالي
    const campaigns = await Campaign.find({ creator: req.user._id });

    // عرض الحملات في الصفحة
    res.render('campaigns', { campaigns, user: req.user });
  } catch (err) {
    console.error('  An error occurred  :', err);
    res.status(500).send(' An error occurred');
  }
});

// عرض بروفايل المستخدم مع الحملات الخاصة به


// عرض صفحة إنشاء حملة جديدة
router.get('/create-campaign', (req, res) => {
  res.render('create-campaign');  // تأكد أن لديك قالب EJS باسم create-campaign.ejs
});

// إنشاء حملة جديدة
router.post('/create-campaign', async (req, res) => {
  const { companyName, campaignName, startDate, endDate, targetAudience, discountCode, description } = req.body;

  // التحقق من أن الحقل 'campaignName' ليس فارغًا
  if (!campaignName) {
    return res.status(400).send('Campaign Name is required');
  }

  try {
    const newCampaign = new Campaign({
      companyName,
      campaignName,
      startDate,
      endDate,
      targetAudience,
      discountCode,
      description,
      creator: req.user._id,  // ربط الحملة بالمستخدم الذي قام بإنشائها
    });

    await newCampaign.save();
    res.redirect('/campaigns');
  } catch (err) {
    console.error("Error details:", err);  // طباعة التفاصيل
    res.status(500).send("Error creating campaign: " + err.message);
  }
});

// عرض المؤثرين
router.get('/influencers', async (req, res) => {
  try {
    const influencers = await User.find({ role: 'influencer' });
    console.log(influencers);  // تحقق من أن البيانات موجودة
    res.render('influencers', { influencers });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving influencers.");
  }
});

// استهداف المؤثرين في الحملة
router.post('/target-influencers', async (req, res) => {
  const { targetAudience } = req.body;
  const influencers = await User.find({ interests: { $in: targetAudience } });
  res.render('influencers', { influencers });
});

// عرض تفاصيل الحملة
router.get('/:id', async (req, res) => {
  const campaignId = req.params.id;  // استخراج معرّف الحملة من الرابط
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).send("Campaign not found.");
    }
    res.render('campaign-detail', { campaign , user: req.user });
  } catch (err) {
    res.status(500).send("Error retrieving campaign details.");
  }
});

module.exports = router;
