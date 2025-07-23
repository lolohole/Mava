const socket = io();

socket.on('connect', () => {
  socket.emit('register', CURRENT_USER_ID); // عرفه من الـ template
});

socket.on('notif', (data) => {
  const notifCount = document.getElementById('notifCount');
  notifCount.style.display = 'inline-block';
  notifCount.textContent = Number(notifCount.textContent || 0) + 1;

  const notifList = document.getElementById('notifItems');
  const li = document.createElement('li');
  li.classList.add('list-group-item');
  li.innerHTML = `📨  New message: ${data.message}`;
  notifList.prepend(li);
});
