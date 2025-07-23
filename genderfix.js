const mongoose = require('mongoose');
const User = require('./models/User'); // تأكد أن المسار صحيح حسب مشروعك

// الاتصال بقاعدة البيانات
mongoose.connect('mongodb+srv://basemHalaika:V5ieA0XcG47tlo5h@clusterappstore.srfmfwr.mongodb.net/portfolioDB?retryWrites=true&w=majority&appName=clusterAppStore', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Connected to MongoDB');

  // تحديث المستخدمين الذين لديهم gender غير صحيح
  const result = await User.updateMany(
    { gender: { $nin: ['male', 'female', 'other'] } }, // شرط التحديث
    { $set: { gender: 'other' } }                       // القيمة الصحيحة
  );

  console.log(`✅ تم تحديث ${result.modifiedCount} مستخدم لديه gender غير صالح`);
  mongoose.disconnect();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});
