const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');

const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const Post = require('./models/Posts');
const Notification = require('./models/Notification');

dotenv.config();

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const Sentiment = require('sentiment');
const sentiment = new Sentiment();

// لإدارة sockets المستخدمين
const userSockets = new Map();
const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL   // مهم جداً
});

client.connect()
  .then(() => console.log('✅ Connected to Redis'))
  .catch(err => console.error('❌ Redis error:', err));



// رسائل الأحداث
client.on('connect', () => {
  console.log('✅ Connected to Redis Cloud!');
});

client.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// تصدير العميل لاستخدامه في ملفات أخرى
module.exports = client;

redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect();

app.set('redisClient', redisClient);

// إعداد EJS
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


// الجلسة
app.use(session({
  secret: process.env.SESSION_SECRET || 'mysecret',
  resave: false,
  saveUninitialized: false,
}));

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI || require('./config').mongoURI)
  .then(() => console.log('📦 Connected to MongoDB'))
  .catch(err => console.error('❌ DB Error:', err));

// المستخدم الحالي في كل الطلبات
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        res.locals.currentUser = user;
        req.user = user;
      } else {
        res.locals.currentUser = null;
      }
    } catch {
      res.locals.currentUser = null;
    }
  } else {
    res.locals.currentUser = null;
  }
  res.locals.title = "mava";
  next();
});

app.use((req, res, next) => {
  res.locals.token = req.cookies.token || null;
  next();
});

// الراوترات
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const chatRoutes = require('./routes/chats');
const settingsRoutes = require('./routes/settings');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const notificationRoutes = require('./routes/notifications');
const campaignsRouter = require('./routes/campaigns');
const contactRouter = require('./routes/contact');
const profileCampaignsRouter = require('./routes/profile-campaigns');
// Use the contact routes

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/users', authMiddleware, userRoutes);
app.use('/posts', authMiddleware, postRoutes);
app.use('/settings', authMiddleware, settingsRoutes);
app.use('/', chatRoutes);
app.use('/', productRoutes);
app.use('/orders', orderRoutes);
app.use('/', notificationRoutes);
app.use('/campaigns', campaignsRouter);
app.use('/contact', contactRouter);
app.use('/profile-campaigns', profileCampaignsRouter);



// صفحة البروفايل
app.get('/profile/:id', async (req, res) => {
  try {
    const profileUser = await User.findById(req.params.id);
    if (!profileUser) return res.status(404).send('المستخدم غير موجود');

    if (profileUser.privacy === 'private' && (!req.session.userId || String(req.session.userId) !== String(profileUser._id))) {
      const viewer = await User.findById(req.session.userId);
      const isFollowing = viewer?.following?.some(f => String(f) === String(profileUser._id));
      if (!isFollowing) return res.render('private-account', { user: profileUser });
    }

    const posts = await Post.find({ user: profileUser._id }).populate('user comments.user');
    res.render('profile', { profileUser, posts });
  } catch (err) {
    console.error(err);
    res.status(500).send('حدث خطأ');
  }
});

// عرض منشور
app.get('/posts/:id', authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id).populate('user comments.user');
  if (!post) return res.status(404).send('هذا المنشور غير موجود');
  res.render('post', { post, currentUser: req.user });
});

// لايك مع إشعار
app.post('/like/:postId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send('Post not found');

    if (!post.likes.includes(req.user._id)) {
      post.likes.push(req.user._id);
      await post.save();

      if (String(post.user) !== String(req.user._id)) {
        await Notification.create({
          recipient: post.user,
          user: req.user._id,
          type: 'like',
          post: post._id,
          isRead: false,
          createdAt: new Date()
        });
      }
    }

    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error liking post');
  }
});

// تعليق على منشور
app.post('/comment/:postId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send('Post not found');

    post.comments.push({ user: req.user._id, text: req.body.comment });
    await post.save();

    if (String(post.user) !== String(req.user._id)) {
      await Notification.create({
        recipient: post.user,
        user: req.user._id,
        type: 'comment',
        post: post._id,
        isRead: false,
        createdAt: new Date()
      });
    }

    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error commenting');
  }
});


// ✅✅ Socket.IO Logic
io.on('connection', (socket) => {
  console.log('🟢 مستخدم متصل عبر Socket.IO');

  socket.on('register', userId => {
    userSockets.set(userId, socket.id);
    console.log(`✅ سجل المستخدم: ${userId}`);
  });

  socket.on('joinConv', convId => {
    socket.join(convId);
    console.log(`📥 انضم المستخدم للمحادثة: ${convId}`);
  });

  socket.on('sendMsg', async ({ convId, senderId, receiverId, message }) => {
    try {
      const result = sentiment.analyze(message);
      const score = result.score;

      let emotion = 'محايد';
      if (score > 3) {
        emotion = 'حب';
      } else if (score > 0) {
        emotion = 'إيجابي';
      } else if (score < -3) {
        emotion = 'غضب';
      } else if (score < 0) {
        emotion = 'سلبي';
      }

      const newMsg = await Message.create({
        sender: senderId,
        receiver: receiverId,
        conversation: convId,
        message,
        sentimentScore: score,
        emotion,
        createdAt: new Date()
      });

      io.to(convId).emit('newMsg', {
        ...newMsg.toObject(),
        emotion
      });

      await Conversation.findByIdAndUpdate(convId, {
        lastMessage: message,
        updatedAt: new Date()
      });

    } catch (err) {
      console.error('❌ خطأ أثناء إرسال الرسالة:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 مستخدم فصل الاتصال');
  });
});

// تشغيل السيرفر
const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});


