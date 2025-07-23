const Message = require('../models/Message');
const User = require('../models/User');

// 📩 إنشاء رسالة جديدة
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      message
    });

    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Send Message Error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// 📜 جلب المحادثة مع مستخدم معين
exports.getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id }
      ]
    }).sort('createdAt');

    res.json(messages);
  } catch (err) {
    console.error('Get Conversation Error:', err);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
};

// 📬 جلب جميع المحادثات الأخيرة للمستخدم
exports.getUserChats = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', currentUserId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    const chats = [];

    for (let chat of messages) {
      const user = await User.findById(chat._id);
      if (user) {
        chats.push({
          user,
          message: chat.lastMessage.message,
          time: chat.lastMessage.createdAt
        });
      }
    }

    res.json(chats);
  } catch (err) {
    console.error('Get User Chats Error:', err);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
};

exports.getUserChatsForView = async (currentUserId) => {
  const chats = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: currentUserId },
          { receiver: currentUserId }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', currentUserId] },
            '$receiver',
            '$sender'
          ]
        },
        lastMessage: { $first: '$$ROOT' }
      }
    }
  ]);

  // إضافة بيانات المستخدم لكل محادثة
  const results = [];
  for (let chat of chats) {
    const user = await User.findById(chat._id);
    if (user) {
      results.push({
        user,
        message: chat.lastMessage.message,
        time: chat.lastMessage.createdAt
      });
    }
  }

  return results;
};
