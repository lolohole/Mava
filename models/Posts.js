const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  image: String,
  video: { type: String },  // رابط الفيديو في Cloudinary أو مكان آخر
  link: { type: String },   // رابط خارجي، مثلاً YouTube, موقع ... 
  caption: String,
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    text: String,
    image: { type: String },   // صورة في التعليق (اختياري)
    video: { type: String },   // فيديو في التعليق (اختياري)
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  reactions: [{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['heart', 'clap', 'sad'],
    required: true
  }
}]


});

module.exports = mongoose.model('Post', postSchema);
