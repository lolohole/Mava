const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const vader = require('vader-sentiment');

module.exports = (io, userSockets) => {
  io.on('connection', socket => {
    socket.on('register', userId => {
      userSockets[userId] = socket.id;
    });

    socket.on('joinConv', convId => {
      socket.join(convId);
    });

    socket.on('sendMsg', async ({ convId, senderId, receiverId, message }) => {
      try {
        const conv = await Conversation.findById(convId);
        if (!conv) return;

        const sentimentResult = vader.SentimentIntensityAnalyzer.polarity_scores(message);
        const sentimentScore = sentimentResult.compound;
        let emotion = "محايد";
        if (sentimentScore >= 0.05) emotion = "إيجابي";
        else if (sentimentScore <= -0.05) emotion = "سلبي";
        if (message.includes('أحبك') || message.includes('بحبك') || message.includes('حبيبي')) emotion = "حب";
        else if (message.includes('غضبان') || message.includes('زعل') || message.includes('حزين')) emotion = "غضب";

        const msg = await Message.create({
          conversation: convId,
          sender: senderId,
          receiver: receiverId,
          message,
          sentimentScore,
          emotion
        });

        await Conversation.findByIdAndUpdate(convId, {
          lastMessage: message,
          updatedAt: Date.now()
        });

        const payload = {
          _id: msg._id,
          sender: msg.sender,
          receiver: msg.receiver,
          message: msg.message,
          sentimentScore: msg.sentimentScore,
          emotion: msg.emotion,
          createdAt: msg.createdAt
        };

        io.to(convId).emit('newMsg', payload);

        if (userSockets[receiverId]) {
          io.to(userSockets[receiverId]).emit('notif', {
            convId, message, from: senderId, time: msg.createdAt
          });
        }

      } catch (err) {
        console.error('خطأ في sendMsg:', err);
      }
    });
  });
};
