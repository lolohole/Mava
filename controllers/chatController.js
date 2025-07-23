const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

exports.list = async (req, res) => {
  const convs = await Conversation.find({ participants: req.user._id })
    .sort('-updatedAt')
    .populate('participants', 'username avatar')
    .lean();
  res.render('conversations', { conversations: convs, user: req.user });
};

exports.create = async (req, res) => {
  const { otherId } = req.body;
  let conv = await Conversation.findOne({ participants: { $all: [req.user._id, otherId] } });
  if (!conv) conv = await Conversation.create({ participants: [req.user._id, otherId] });
  res.json({ convId: conv._id });
};

exports.show = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    const other = await User.findById(otherUserId);
    if (!other) return res.status(404).send('User not found');

    let conv = await Conversation.findOne({
      participants: { $all: [req.user._id, otherUserId] }
    }).populate('participants', 'username avatar');

    if (!conv) {
      conv = await Conversation.create({ participants: [req.user._id, otherUserId] });
      conv = await Conversation.findById(conv._id).populate('participants', 'username avatar');
    }

    if (!conv || !Array.isArray(conv.participants)) {
      return res.status(404).send('The data is incorrect');
    }

    const msgs = await Message.find({ conversation: conv._id }).sort('createdAt').lean();

    const otherParticipant = conv.participants.find(p => !p._id.equals(req.user._id));
    if (!otherParticipant) {
      return res.status(400).send('The other party cannot be found in the conversation.');
    }

    res.render('chat', {
      conversation: conv,
      messages: msgs,
      user: req.user,
      otherUser: otherParticipant
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('A server error occurred.');
  }
};
