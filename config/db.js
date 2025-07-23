// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1); // للخروج من السيرفر إذا فشل الاتصال
  }
};

module.exports = connectDB;
