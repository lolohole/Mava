const express = require('express');
const router = express.Router();
const Post = require('../models/Posts');
const User = require('../models/User');
const auth = require('../middlewares/authMiddleware');
const Notification = require('../models/Notification');

const CURRENT_USER_ID = '64babc123456789000000000';

// إنشاء مستخدم وهمي إذا لم يكن موجود
User.findById(CURRENT_USER_ID).then(user => {
  if (!user) {
    const u = new User({ _id: CURRENT_USER_ID, username: 'Me', password: 'defaultPassword123!' });
    u.save();
  }
});

// الصفحة الرئيسية
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("user", "username avatar")
      .sort({ createdAt: -1 });

    let currentUser = null;
    if (req.session.userId) {
      currentUser = await User.findById(req.session.userId).select('username avatar bookmarks');
    }

    res.render("index", { posts, currentUser });
  } catch (error) {
    console.error("Error loading posts:", error);
    res.status(500).send("An error occurred while loading posts..");
  }
});

// صفحات ثابتة
router.get('/about', (req, res) => res.render('about', { title: 'about' }));
router.get('/apps', (req, res) => res.render('apps', { title: 'apps' }));
router.get('/contact', (req, res) => res.render('contact', { title: 'contact' }));
router.get('/portfolio', (req, res) => res.render('portfolio', { title: 'portfolio' }));
router.get('/sites', (req, res) => res.render('sites', { title: 'sites' }));

// صفحة البروفايل للمستخدم الحالي


// صفحة الإشعارات
router.get('/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar') // المرسل
      .populate('post')
      .limit(20);

    res.render('notifications', { notifications, currentUser: req.user });
  } catch (err) {
    console.error('Error loading notifications:', err);
    res.status(500).send('An error occurred while loading notifications.');
  }
});

// وضع علامة مقروء على إشعار
router.post('/notifications/read/:id', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update notification status' });
  }
});

// البحث
router.get('/search', auth, async (req, res) => {
  let query = req.query.q;
  if (!query || typeof query !== 'string') return res.redirect('/');

  query = query.trim();
  if (query.length === 0) return res.redirect('/');

  try {
    // الحد الأقصى للنتائج للحد من الحمل على السيرفر
    const MAX_RESULTS = 20;

    // بحث نصي في الـ Users على الحقل username
    const users = await User.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" }, username: 1, avatar: 1 }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(MAX_RESULTS);

    // بحث نصي في الـ Posts على الحقل caption
    const posts = await Post.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" }, caption: 1, user: 1, createdAt:1 }
    )
    .sort({ score: { $meta: "textScore" } })
    .populate('user', 'username avatar')
    .limit(MAX_RESULTS);

    res.render('searchResults', {
      query,
      users,
      posts,
      currentUser: req.user
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).send('An error occurred while searching.');
  }
});
// عرض منشور محدد
router.get('/post/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user');
    if (!post) return res.status(404).send('The post does not exist');
    res.render('post', { post });
  } catch (err) {
    console.error('Error loading post:', err);
    res.status(500).send('An error occurred while loading the post.');
  }
});

// لايك منشور
router.post('/post/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('The post does not exist');

    if (!post.likes.includes(req.user._id)) {
      post.likes.push(req.user._id);
      await post.save();

      if (post.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.user,
          user: req.user._id,
          type: 'like',
          post: post._id,
          isRead: false,
          createdAt: new Date()
        });
        const io = req.app.get('io');
if (io) {
  io.to(recipientId.toString()).emit('newNotification', {
    type: 'comment',
    message: `${req.user.username} Comment on your post`,
  });
}

      }
    }

    res.redirect('/post/' + post._id);
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).send('An error occurred while liking.');
  }
});

// تعليق على منشور
router.post('/post/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user');
    if (!post) return res.status(404).send('The post does not exist');

    post.comments.push({
      user: req.user._id,
      text: req.body.comment
    });

    await post.save();

    console.log('🔎 post.user:', post.user);
    console.log('🔎 req.user:', req.user);
    console.log('🔎 req.user._id:', req.user?._id);

    console.log('🔎 recipientId:', recipientId);

    const recipientId = post.user && post.user._id ? post.user._id : post.user;

if (recipientId && req.user && req.user._id && recipientId.toString() !== req.user._id.toString()) {
  await Notification.create({
    recipient: recipientId,
    user: req.user._id,
    type: 'comment',
    post: post._id,
    isRead: false,
    createdAt: new Date()
  });
  const io = req.app.get('io');
if (io) {
  io.to(recipientId.toString()).emit('newNotification', {
    type: 'comment',
    message: `${req.user.username} Comment on your post`,
  });
}

} else {
  console.warn('Skipping notification creation due to missing recipient or user.');
}


    res.redirect('/post/' + post._id);
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).send('An error occurred while adding the comment.');
  }
});


module.exports = router;
