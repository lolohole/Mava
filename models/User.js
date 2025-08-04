const mongoose = require('mongoose');
const Role = require('./Role'); // استيراد نموذج الأدوار

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 }
});

const productSchema = new mongoose.Schema({
  name: String,
  image: String,
  price: Number,
  description: String,
  contactLink: String
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  userCode: {
    type: String,
    unique: true,
    required: true,
  },
  fullName: String,
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0 },
  badges: [String],
  isVip: { type: Boolean, default: false },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],

  createdAt: { type: Date, default: Date.now },
  phone: String,
  location: String,
  dob: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  website: String,
  bio: String,
  avatar: String,

  isCompany: { type: Boolean, default: false },
  products: [productSchema],
  services: [serviceSchema],

  showEmail: { type: Boolean, default: true },

  otp: String,
  otpExpires: Date,
  verified: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },

  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: null },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: true
  },

  interests: { type: [String], required: true },

  isDarkMode: { type: Boolean, default: false },

  themeSettings: {
    postBgColor: { type: String, default: '#ffffff' },
    postTextColor: { type: String, default: '#000000' },
    chatBgColor: { type: String, default: '#f5f5f5' },
    chatTextColor: { type: String, default: '#000000' },
    notificationColor: { type: String, default: '#ffeb3b' },
    savedPostsBgColor: { type: String, default: '#e0e0e0' },
    backgroundAnimation: { type: String, default: 'particles' }
  },

  // روابط السوشيال ميديا
  links: {
    tiktok: { type: String, default: '' },
    instagram: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    facebook: { type: String, default: '' },
    x: { type: String, default: '' }
  },

  // إشعارات (الرسائل)

  // إعدادات تفعيل الإشعارات (مثل الإعجابات والتعليقات)
  notificationSettings: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    newFollowers: { type: Boolean, default: true }
  },

  // المتابعين والمتابَعين
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
