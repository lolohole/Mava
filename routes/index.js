// routes/index.js

const express = require('express');
const router = express.Router();
const Post = require('../models/Posts');
const User = require('../models/User');
const auth = require('../middlewares/authMiddleware');
const Notification = require('../models/Notification');

// The static user to simulate as an example (ensure it doesn't re-create)
const CURRENT_USER_ID = '64babc123456789000000000';
User.findById(CURRENT_USER_ID).then(user => {
  if (!user) {
    // Create a default user only if it doesn't exist
    const u = new User({ _id: CURRENT_USER_ID, username: 'Me', password: 'defaultPassword123!' });
    u.save();
  }
});

// Home Page: Display posts with user data (latest first)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("user", "username avatar")
      .populate("comments.user", "username avatar") // Populate التعليقات
      .sort({ createdAt: -1 });

    let currentUser = null;
    if (req.session.userId) {
      currentUser = await User.findById(req.session.userId).select('username avatar bookmarks savedPosts');
    }

    res.render("index", { posts, currentUser });
  } catch (error) {
    console.error("Error loading posts:", error);
    res.status(500).send("An error occurred while loading posts.");
  }
});

// نقطة النهاية الخاصة بتحميل المزيد من التعليقات
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId).populate("comments.user", "username avatar");

    // عرض تعليقات بعد 3
    const allComments = post.comments;
    const commentsToShow = allComments.slice(3);

    res.json({ comments: commentsToShow });
  } catch (error) {
    console.error("Error loading comments:", error);
    res.status(500).send("An error occurred while loading comments.");
  }
});


// Static Pages Routes (About, Apps, Contact, etc.)
router.get('/about', (req, res) => res.render('about', { title: 'About Us' }));
router.get('/apps', (req, res) => res.render('apps', { title: 'Apps' }));
router.get('/contact', (req, res) => res.render('contact', { title: 'Contact Us' }));
router.get('/portfolio', (req, res) => res.render('portfolio', { title: 'Portfolio' }));
router.get('/sites', (req, res) => res.render('sites', { title: 'Sites' }));
router.get('/job-application', (req, res) => res.render('job-application', { title: 'job-application',   layout: false, }));


// Notifications Page
router.get('/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })  // Get the latest notifications first
      .populate('user', 'username avatar') // Include the sender's info
      .populate('post')  // Include post info where necessary
      .limit(20);  // Limit the number of notifications to 20

    res.render('notifications', { notifications, currentUser: req.user });
  } catch (err) {
    console.error('Error loading notifications:', err);
    res.status(500).send('An error occurred while loading notifications.');
  }
});

// Mark notification as read
router.post('/notifications/read/:id', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update notification status' });
  }
});

// Search functionality
router.get('/search', auth, async (req, res) => {
  let query = req.query.q;
  
  if (!query || typeof query !== 'string') return res.redirect('/');
  
  query = query.trim();
  if (query.length === 0) return res.redirect('/');

  try {
    // Limit the number of results to prevent performance issues
    const MAX_RESULTS = 20;

    // Search in Users and Posts by text
    const users = await User.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" }, username: 1, avatar: 1 }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(MAX_RESULTS);

    const posts = await Post.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" }, caption: 1, user: 1, createdAt: 1 }
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
/*
// View a specific post
router.get('/post/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user');
    if (!post) return res.status(404).send('The post does not exist');
    res.render('post', { post , currentUser: req.user.username });
  } catch (err) {
    console.error('Error loading post:', err);
    res.status(500).send('An error occurred while loading the post.');
  }
});

// Like a post
router.post('/post/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('The post does not exist');

    if (!post.likes.includes(req.user._id)) {
      post.likes.push(req.user._id);
      await post.save();

      // If the user is not the post owner, send a notification
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
          io.to(post.user.toString()).emit('newNotification', {
            type: 'like',
            message: `${req.user.username} liked your post!`,
          });
        }
      }
    }

    res.redirect('/post/' + post._id);
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).send('An error occurred while liking the post.');
  }
});

// Comment on a post
router.post('/post/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user');
    if (!post) return res.status(404).send('The post does not exist');

    // Add the new comment to the post
    post.comments.push({
      user: req.user._id,
      text: req.body.comment
    });

    await post.save();

    const recipientId = post.user._id;
    if (recipientId && req.user._id && recipientId.toString() !== req.user._id.toString()) {
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
          message: `${req.user.username} commented on your post!`,
        });
      }
    }

    res.redirect('/post/' + post._id);
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).send('An error occurred while adding the comment.');
  }
});
*/
module.exports = router;
