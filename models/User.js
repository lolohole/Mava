const mongoose = require('mongoose');
notifications: [{
    message: String,
    isRead: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
}]

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 }
});
const productSchema = new mongoose.Schema({
    name: String,
    image: String,
    price: Number,
    description: String,
    contactLink: String, // واتساب أو رابط خارجي
});
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String },
  email: { type: String, unique: true, sparse: true }, // sparse للسماح بوجود قيم null متعددة
  password: { type: String, required: true },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  createdAt: { type: Date, default: Date.now },
  phone: { type: String },
  location: { type: String },
  interests: [String],
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  website: { type: String },
   isCompany: { type: Boolean, default: false },
    products: [productSchema], // منتجات مصغرة
  bio: { type: String },
  avatar: { type: String },
  privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  otp: String,
  otpExpires: Date,
  verified: { type: Boolean, default: false },
  role: {
  type: String,
  enum: ['user', 'admin'],
  default: 'user', // ✅ مهم!
  required: true
},
isDarkMode: {
    type: Boolean,
    default: false
  } ,
  themeSettings: {
    postBgColor: { type: String, default: '#ffffff' },
    postTextColor: { type: String, default: '#000000' },
    chatBgColor: { type: String, default: '#f5f5f5' },
    chatTextColor: { type: String, default: '#000000' },
    notificationColor: { type: String, default: '#ffeb3b' },
    savedPostsBgColor: { type: String, default: '#e0e0e0' },
    backgroundAnimation: {
    type: String,
    default: 'particles' // مثلاً: 'particles', 'stars', 'waves', إلخ.
  }
  } ,
  interests: { type: [String], required: true },  // تأكد من وجود 'interests'
  isOnline: { type: Boolean, default: false },
lastSeen: { type: Date, default: null },
isVerified: { type: Boolean, default: false },

showEmail: { type: Boolean, default: true }, // يتحكم بإظهار البريد


  // تويتر الجديد


savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],

  links: {
    tiktok: { type: String, default: '' },
    instagram: { type: String, default: '' },
    github: { type: String, default: '' }  ,
    linkedin: { type: String, default: '' },
  facebook: { type: String, default: '' },
  x: { type: String, default: '' }, 
  },

  services: [serviceSchema],  // إضافة الخدمات كمصفوفة من الخدمات
  
  notifications: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    newFollowers: { type: Boolean, default: true }
  },

  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
