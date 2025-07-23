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
role: {
  type: String,
  enum: ['user', 'admin'],
  default: 'user', // ✅ مهم!
  required: true
},
  interests: { type: [String], required: true },  // تأكد من وجود 'interests'

  links: {
    tiktok: { type: String, default: '' },
    instagram: { type: String, default: '' },
    github: { type: String, default: '' }
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
