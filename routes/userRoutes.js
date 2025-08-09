const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Posts');
const multer = require('multer');
const path = require('path');
const auth = require('../middlewares/authMiddleware');
const Notification = require('../models/Notification');

// إعداد multer لتخزين الصور
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// إعداد Cloudinary
cloudinary.config({
  cloud_name: 'djsi7vcsl',  // استبدلها بـ cloud_name الخاص بك من Cloudinary
  api_key: '616254387969826',        // استبدلها بـ api_key الخاص بك من Cloudinary
  api_secret: 'F1uc2OzqIRqOWNKAzzkfBNV1ERM'  
});

// إعداد multer لاستخدام Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile-pichre', // اسم مجلد التخزين في Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  },
});

const upload = multer({ storage });



// ✅ 1. الملف الشخصي للمستخدم الحالي
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.redirect('/auth/login');

    const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 });

    res.render('profile', {
      profileUser: user,
      currentUser: user,
      posts,
      isFollowing: false,
      isOwnProfile: true
    });
  } catch (err) {
    console.error('Profile Error:', err);
    res.status(500).send(' An error occurred while loading the profile.');
  }
});


// ✅ 2. عرض بروفايل أي مستخدم عبر الـ ID
router.get('/:id', auth, async (req, res, next) => {
  if (req.params.id === 'editProfile' || req.params.id === 'profile' || req.params.id === 'username') {
    return next();
  }

  try {
    const profileUser = await User.findById(req.params.id).populate('followers following');
    if (!profileUser) return res.status(404).send('  User not found');

    const loggedInUser = await User.findById(req.user._id);

    // تحقق من الخصوصية
    const isOwnProfile = loggedInUser._id.toString() === profileUser._id.toString();
    const isFollowing = loggedInUser.following.includes(profileUser._id);

    if (profileUser.privacy === 'private' && !isOwnProfile && !isFollowing) {
return res.render('private-account', {
  profileUser,
  currentUser: loggedInUser,
  posts: [],
});
    }

    const posts = await Post.find({ user: profileUser._id }).sort({ createdAt: -1 });

    res.render('profile', {
      profileUser,
      loggedInUser,
      posts,
      isFollowing,
      isOwnProfile,
    });
  } catch (err) {
    console.error('Public Profile Error:', err);
    res.status(500).send('An error occurred while displaying the profile.');
  }
});                                                                                                                                                                                                                router.get('/username/:username', auth, async (req, res) => {
  try {
    const profileUser = await User.findOne({ username: req.params.username }).populate('followers following');
    if (!profileUser) return res.status(404).send('User not found');

    const loggedInUser = await User.findById(req.user._id);

    // تحقق من الخصوصية
    const isOwnProfile = loggedInUser._id.toString() === profileUser._id.toString();
    const isFollowing = loggedInUser.following.includes(profileUser._id);

    if (profileUser.privacy === 'private' && !isOwnProfile && !isFollowing) {
return res.render('private-account', {
  profileUser,
  currentUser: loggedInUser,
  posts: [],
});
    }

    const posts = await Post.find({ user: profileUser._id });

    res.render('profile', {
      profileUser,
      loggedInUser,
      posts,
      isFollowing,
      isOwnProfile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


// ✅ 4. تعديل الملف الشخصي
router.get('/editProfile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render('editProfile', { user, layout: false });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading the edit profile page');
  }
});

router.post('/editProfile', auth, upload.single('avatar'), async (req, res) => {
  try {
    let services = [];
    if (req.body.services) {
      if (Array.isArray(req.body.services)) {
        services = req.body.services;
      } else if (typeof req.body.services === 'object') {
        services = Object.values(req.body.services);
      }
      services = services.map(service => ({
        name: service.name,
        price: Number(service.price) || 0
      }));
    }

    const updateData = {
      fullName: req.body.fullName || '',
      email: req.body.email || '',
      phone: req.body.phone || '',
      location: req.body.location || '',
      dob: req.body.dob ? new Date(req.body.dob) : null,
      gender: ['male', 'female', 'other'].includes(req.body.gender) ? req.body.gender : 'other',
      bio: req.body.bio || '',
      links: {
        tiktok: req.body['links[tiktok]'] || req.body.tiktok || '',
        instagram: req.body['links[instagram]'] || req.body.instagram || '',
        github: req.body['links[github]'] || req.body.github || '' ,
         linkedin: req.body['links[linkedin]'] || req.body.linkedin || '', linkedin: req.body.linkedin || '',
         facebook: req.body['links[facebook]'] || req.body.facebook || '', facebook: req.body.facebook || '',
        x: req.body['links[x]'] || req.body.x || '',
      },
      
  

showEmail: req.body.showEmail === 'on' ,

      services: services || []
    };

    if (req.file && req.file.path) {
      // هنا نستخدم رابط الصورة من Cloudinary (path يحتوي على URL)
      updateData.avatar = req.file.path;
    }

    await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    res.redirect('/users/profile');
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).send('Failed to update data');
  }
});

/// ✅ 5. متابعة / إلغاء متابعة
router.post('/follow/:id', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser || targetUser._id.equals(currentUser._id)) {
      return res.status(400).send('This user cannot be followed.');
    }

    const alreadyFollowing = targetUser.followers.includes(currentUser._id);

    if (!alreadyFollowing) {
      targetUser.followers.push(currentUser._id);
      currentUser.following.push(targetUser._id);

      const notif = new Notification({
        recipient: targetUser._id,
        user: currentUser._id,
        type: 'follow',
        isRead: false,
        message: `${currentUser.username} He started following you`
      });
      await notif.save();
       if (!targetUser.role) targetUser.role = 'user';
if (!currentUser.role) currentUser.role = 'user';

      await targetUser.save();
      await currentUser.save();

      // إرسال التحديثات كـ JSON
      return res.json({
        success: true,
        followersCount: targetUser.followers.length
      });
    } else {
      return res.status(400).send('You are already following this user.');
    }
  } catch (err) {
    console.error('Follow Error:', err);
    res.status(500).send('An error occurred while proceeding.');
  }
});

router.post('/unfollow/:id', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    targetUser.followers = targetUser.followers.filter(
      f => f.toString() !== currentUser._id.toString()
    );
    currentUser.following = currentUser.following.filter(
      f => f.toString() !== targetUser._id.toString()
    );

    await targetUser.save();
    await currentUser.save();

    const io = req.app.get('io');
    if (io) {
      io.to(targetUser._id.toString()).emit('newNotification', {
        type: 'unfollow',
        message: `${currentUser.username}  Unfollow you`
      });
    }

    // إرسال التحديثات كـ JSON
    return res.json({
      success: true,
      followersCount: targetUser.followers.length
    });

  } catch (err) {
    console.error('Unfollow Error:', err);
    res.status(500).send('An error occurred while unfollowing.');
  }
});





// ✅ 6. حذف الحساب
router.post('/profile/delete', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    await Post.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    req.session.destroy(err => {
      if (err) {
        console.error('Error deleting account:', err);
      }
      res.status(200).json({ redirect: '/login' });
    });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Error deleting account' });
  }
});



module.exports = router;


