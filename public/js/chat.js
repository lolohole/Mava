document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  const currentUserId = document.getElementById('currentUserId').value;
  const otherUserId = document.getElementById('otherUserId').value;
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const chatBox = document.getElementById('chat-box');

  // تسجيل المستخدم في السوكت
  socket.emit('register', currentUserId);

  // إنشاء معرف الغرفة بحيث يكون ثابت للطرفين
  const roomId = [currentUserId, otherUserId].sort().join('-');

  // الانضمام إلى الغرفة
  socket.emit('joinRoom', roomId);

  // إرسال رسالة
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
      socket.emit('chatMessage', {
        roomId,
        senderId: currentUserId,
        receiverId: otherUserId,
        message
      });
      messageInput.value = '';
    }
  });

  // استقبال الرسالة وعرضها
  socket.on('message', ({ senderId, message, createdAt }) => {
    const isOwnMessage = senderId === currentUserId;
    const messageDiv = document.createElement('div');
    messageDiv.className = `mb-2 ${isOwnMessage ? 'text-end text-primary' : 'text-start text-dark'}`;
    messageDiv.innerHTML = `
      <small><strong>${isOwnMessage ? 'You' : ' The other party'}:</strong></small>
      <p class="mb-0">${message}</p>
      <small class="text-muted">${new Date(createdAt).toLocaleTimeString()}</small>
    `;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  });
});
