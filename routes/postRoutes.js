const express = require('express');
const router = express.Router();
const Post = require('../models/Posts');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const util = require('util');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// إعداد التخزين لكل نوع ملف
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'images', allowed_formats: ['jpg','png','jpeg'] },
});
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'videos', resource_type: 'video', allowed_formats: ['mp4','mov','avi'] },
});

// انشئ upload باستخدام function تختار التخزين المناسب لكل ملف
const upload = multer({
  storage: {
    _handleFile(req, file, cb) {
      const dest = file.mimetype.startsWith('video/') ? videoStorage : imageStorage;
      dest._handleFile(req, file, cb);
    },
    _removeFile(req, file, cb) {
      const dest = file.mimetype.startsWith('video/') ? videoStorage : imageStorage;
      dest._removeFile(req, file, cb);
    }
  }
});

const uploadImage = multer({ storage: imageStorage });
const uploadVideo = multer({ storage: videoStorage });

router.get('/new', auth, (req, res) => {
  res.render('createPost', {layout: false});
});

router.post('/add', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📦 req.files:', util.inspect(req.files, { depth: null }));
    console.log('📝 req.body:', req.body);

    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    if (!imageFile && !videoFile) {
      return res.status(400).send('Image or video is required.');
    }

    const media = videoFile ? videoFile.path : imageFile.path;
    const mediaType = videoFile ? 'video' : 'image';

    const post = new Post({
      user: req.user._id,
      caption: req.body.caption || '',
      media,
      mediaType
    });
    await post.save();

    // إرسال إشعار لصاحب المنشور (في حال كان هناك مستخدم آخر قد أضاف المنشور)
    const user = await User.findById(req.user._id);
    const notif = new Notification({
      recipient: req.user._id,
      user: req.user._id,
      type: 'post',
      post: post._id,
      isRead: false,
      message: `${user.username} added a new post`
    });
    await notif.save();

    res.redirect('/users/' + req.user._id);
  } catch (err) {
    console.error('🔥 Error saving post:', util.inspect(err, { depth: null }));
    res.status(500).send('Failed to create post.');
  }
});


router.post('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'The post does not exist' });

    const userId = req.user._id.toString();
    const liked = post.likes.includes(userId);

    const targetUser = await User.findById(post.user); // صاحب المنشور
    const currentUser = req.user; // المستخدم الذي ضغط على لايك

    const io = req.app.get('io');

    if (liked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);

      // إرسال إشعار لصاحب المنشور إذا لم يكن هو نفسه من ضغط على لايك
      if (!targetUser._id.equals(currentUser._id)) {
        const notif = new Notification({
          recipient: targetUser._id,
          user: currentUser._id,
          type: 'like',
          post: post._id,
          isRead: false,
          message: `${currentUser.username} liked your post`
        });
        await notif.save();

        // إشعار حقيقي (Socket.io) لصاحب المنشور
        if (io) {
          io.to(targetUser._id.toString()).emit('newNotification', {
            type: 'like',
            message: `${currentUser.username} liked your post`
          });

          // 💡 هنا نرسل رسالة شكر للشخص الذي ضغط على Like
          io.to(currentUser._id.toString()).emit('thankYouMessage', {
            from: targetUser.username,
            message: `${targetUser.username} says: Thank you for liking my post! 🥰`
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
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const postId = req.params.postId;
    const originalLength = user.savedPosts.length;

    // التأكد من أن المنشور موجود في المحفوظات
    user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);

    if (user.savedPosts.length === originalLength) {
      return res.status(400).json({ success: false, message: 'Post was not saved' });
    }

    // التأكد من وجود المنشور
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // إنشاء إشعار
    const notif = new Notification({
      recipient: post.user,
      user: req.user._id,
      type: 'unsave',
      post: postId,
      isRead: false,
      message: `${req.user.username} unsaved your post`
    });

    await notif.save();

    // حفظ التغييرات في المستخدم
    await user.save();

    return res.status(200).json({ success: true, message: 'Post unsaved' });
  } catch (error) {
    console.error('Error unsaving post:', error);
  }
});

router.post('/savePost/:postId', auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.savedPosts.includes(postId)) {
      user.savedPosts.push(postId);
      await user.save();

      // إرسال إشعار للمستخدم عند حفظ المنشور
      const post = await Post.findById(postId);
      const notif = new Notification({
        recipient: post.user,
        user: req.user._id,
        type: 'save',
        post: postId,
        isRead: false,
        message: `${req.user.username} saved your post`
      });
      await notif.save();

      return res.status(200).json({ success: true, message: 'Saved' });
    } else {
      return res.status(200).json({ success: true, message: 'Already saved' });
    }
  } catch (error) {
    console.error('Error saving post:', error);
  }
});
// GET صفحة تعديل المنشور
router.get('/edit/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).send('Unauthorized');
    }

    res.render('posts/edit', { post, currentUser: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST تعديل المنشور مع رفع الملفات
router.post('/edit/:id', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).send('Unauthorized');
    }

    post.caption = req.body.caption || post.caption;

    const imageFile = req.files['image']?.[0];
    const videoFile = req.files['video']?.[0];

    if (imageFile) {
      post.media = imageFile.path;
      post.mediaType = 'image';
    } else if (videoFile) {
      post.media = videoFile.path;
      post.mediaType = 'video';
    }

    await post.save();

    // إضافة إشعار عند تعديل المنشور
    const user = await User.findById(req.user._id);
    const notif = new Notification({
      recipient: post.user,
      user: req.user._id,
      type: 'edit',
      post: post._id,
      isRead: false,
      message: `${user.username} edited your post`
    });
    await notif.save();

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

    // إرسال إشعار للمستخدم عند حذف المنشور
    const notif = new Notification({
      recipient: post.user,
      user: req.user._id,
      type: 'alert',
      post: postId,
      isRead: false,
      message: `${req.user.username} deleted your post`
    });
    await notif.save();

    await post.deleteOne();  // هنا بدل remove() نستخدم deleteOne()

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET edit page

router.post('/share/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.shares = (post.shares || 0) + 1;
    await post.save();

    // إرسال إشعار للمستخدم عند مشاركة المنشور
    const notif = new Notification({
      recipient: post.user,
      user: req.user._id,
      type: 'share',
      post: postId,
      isRead: false,
      message: `${req.user.username} shared your post`
    });
    await notif.save();

    res.json({ success: true, shares: post.shares });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error sharing post' });
  }
});


module.exports = router;
