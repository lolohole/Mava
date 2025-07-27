const express = require('express');
const router = express.Router();
const Post = require('../models/Posts');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// إعداد Cloudinary
cloudinary.config({
  cloud_name: 'djsi7vcsl',  // استبدلها بـ cloud_name الخاص بك من Cloudinary
  api_key: '616254387969826',        // استبدلها بـ api_key الخاص بك من Cloudinary
  api_secret: 'F1uc2OzqIRqOWNKAzzkfBNV1ERM'   // استبدلها بـ api_secret الخاص بك من Cloudinary
});

// إعداد multer لاستخدام Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'posts',  // استبدلها باسم المجلد الذي تريد تخزين الصور فيه في Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }] // لتحديد الحجم والتصفية
  },
});

const upload = multer({ storage });

router.get('/new', auth, (req, res) => {
  res.render('createPost', {layout: false});
});

router.post('/add', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'الصورة مطلوبة' });

    // استبدال المسار المحلي بالصورة المخزنة على Cloudinary
    const post = new Post({
      user: req.user._id,
      image: req.file.path, // يحتوي على URL من Cloudinary
      caption: req.body.caption || ''
    });

    await post.save();
    res.redirect('/users/' + req.user._id);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'فشل في إضافة المنشور' });
  }
});

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username avatar')
      .populate('comments.user', 'username')
      .sort({ createdAt: -1 });

    res.render('index', {
      posts,
      currentUser: req.user || null,
      profileUser: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'The post does not exist' });

    const userId = req.user._id.toString();
    const liked = post.likes.includes(userId);

    const targetUser = await User.findById(post.user);
    const currentUser = req.user;

    if (liked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);

      if (!targetUser._id.equals(currentUser._id)) {
        const notif = new Notification({
          recipient: targetUser._id,
          user: currentUser._id,
          type: 'like',
          post: post._id,
          isRead: false,
          message: `${currentUser.username}  Like your post`
        });
        await notif.save();

        const io = req.app.get('io');
        if (io) {
          io.to(targetUser._id.toString()).emit('newNotification', {
            type: 'like',
            message: `${currentUser.username}  Like your post`
          });
        }
      }
    }

    await post.save();
    res.json({ likesCount: post.likes.length, liked: !liked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating likes' });
  }
});
router.post('/comment/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text.trim()) return res.status(400).json({ error: ' Text required' });

    // جلب المنشور بناءً على الـ ID
    const post = await Post.findById(req.params.id).populate('comments.user', 'username');
    if (!post) return res.status(404).json({ error: 'The post does not exist' });

    // إضافة التعليق إلى المنشور
    post.comments.push({ user: req.user._id, text });
    await post.save();

    // إعادة تحميل التعليقات
    await post.populate('comments.user', 'username');
    const targetUser = await User.findById(post.user);
    const currentUser = req.user;

    // إرسال إشعار إلى المستخدم المستهدف إذا كان مختلفًا
    if (!targetUser._id.equals(currentUser._id)) {
      const notif = new Notification({
        recipient: targetUser._id,
        user: currentUser._id,
        type: 'comment',
        post: post._id,
        isRead: false,
        message: `${currentUser.username} Comment on your post`
      });
      await notif.save();

      const io = req.app.get('io');
      if (io) {
        io.to(targetUser._id.toString()).emit('newNotification', {
          type: 'comment',
          message: `${currentUser.username} Comment on your post`
        });
      }
    }

    // إرجاع آخر 3 تعليقات فقط من أجل الـ Pagination
    const comments = post.comments.slice(-3); // أو يمكنك استخدام `limit` هنا
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding comment' });
  }
});


router.post('/bookmark/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const postId = req.params.id;

    const index = user.bookmarks.findIndex(id => id.toString() === postId);

    if (index === -1) {
      user.bookmarks.push(postId);
      await user.save();
      return res.json({ bookmarked: true });
    } else {
      user.bookmarks.splice(index, 1);
      await user.save();
      return res.json({ bookmarked: false });
    }
  } catch (err) {
    console.error('Error bookmarking post:', err);
    res.status(500).json({ error: 'Failed to update favorites' });
  }
});

router.get('/statistics/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const stats = post.reactions.reduce((acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    }, {});

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error loading statistics' });
  }
});

router.get('/comments/:postId', async (req, res) => {
  try {
    const { page = 1, limit = 3 } = req.query;  // إذا لم تكن موجودة، سيتم افتراض الصفحة 1 والحد 3
    const skip = (page - 1) * limit;  // تحديد عدد التعليقات التي يجب تخطيها بناءً على الصفحة

    // جلب المنشور بناءً على ID
    const post = await Post.findById(req.params.postId).populate('comments.user', 'username');
    if (!post) return res.status(404).json({ error: 'The post does not exist' });

    // جلب التعليقات مع التحديد بناءً على الصفحة والعدد (limit)
    const comments = post.comments.slice(skip, skip + limit); // الحصول على التعليقات المحددة للصفحة

    // إرجاع التعليقات بشكل تدريجي
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching comments.' });
  }
});

router.get('/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedPosts');
    res.render('savedPosts', {
      currentUser: user,
      savedPosts: user.savedPosts
    });
  } catch (err) {
    console.error('Saved Posts Error:', err);
    res.status(500).send('Log in to Save.');
  }
});



router.post('/unsavePost/:postId', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.savedPosts = user.savedPosts.filter(id => id.toString() !== req.params.postId);
  await user.save();
  res.json({ success: true });
});
router.post('/savePost/:postId', auth, async (req, res) => {
  const postId = req.params.postId;
  const user = await User.findById(req.user._id);

  if (!user.savedPosts.includes(postId)) {
    user.savedPosts.push(postId);
    await user.save();
    return res.json({ success: true, message: 'Saved' });
  } else {
    return res.status(400).json({ message: 'Already saved' });
  }
});
router.get('/edit/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    // تأكد إن المستخدم هو صاحب المنشور
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }

    res.render('posts/edit', { post, currentUser: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST تحديث المنشور
router.post('/edit/:id', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('req.params.id:', req.params.id);
    console.log('req.body:', req.body);

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).send('Unauthorized');
    }

    post.caption = req.body.caption || post.caption;

    if (req.file) {
      // لو بتستخدم Cloudinary كما في باقي الراوترات
      post.image = req.file.path;  // هذا url الصورة من Cloudinary
    }

    await post.save();

    res.redirect('/posts/' + post._id);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// DELETE post
router.post('/delete/:id', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).send('Post not found');
    }

    // تأكد أن المستخدم هو مالك المنشور أو أدمين قبل الحذف
    if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).send('Unauthorized');
    }

    await post.deleteOne();  // هنا بدل remove() نستخدم deleteOne()

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET edit page
router.get('/edit/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }
    // تحقق صلاحية المستخدم
    if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).send('Unauthorized');
    }
    res.render('posts/edit', { post, currentUser: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST edit post
router.post('/edit/:id', auth, async (req, res) => {
  try {
    console.log('req.params.id:', req.params.id);
    console.log('req.body:', req.body);

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    console.log('Found post:', post);

    if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).send('Unauthorized');
    }

    post.caption = req.body.caption || post.caption;

    if (req.file) {
      post.image = '/uploads/' + req.file.filename;
    }

    await post.save();

    res.redirect('/posts/' + post._id);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
