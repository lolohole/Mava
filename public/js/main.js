// لايك
document.querySelectorAll('.like-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const postId = btn.dataset.id;
    const res = await fetch(`/posts/like/${postId}`, { method: 'POST' });
    const data = await res.json();
    btn.querySelector('.like-count').innerText = data.likes;
  });
});

// تبديل عرض التعليقات
document.querySelectorAll('.comment-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    const section = document.getElementById(`comments-${id}`);
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
  });
});

// إضافة تعليق
document.querySelectorAll('.comment-form').forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const postId = form.dataset.id;
    const text = form.text.value;
    const res = await fetch(`/posts/comment/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ text })
    });
    const comments = await res.json();
    const ul = form.parentElement.querySelector('ul');
    ul.innerHTML = comments.map(c => `<li><strong>${c.user.username}:</strong> ${c.text}</li>`).join('');
    form.text.value = '';
  });
});

// متابعة / إلغاء متابعة
const followBtn = document.getElementById('followBtn');
const unfollowBtn = document.getElementById('unfollowBtn');

async function toggleFollow(userId, action) {
  await fetch(`/users/${action}/${userId}`, { method: 'POST' });
  window.location.reload();
}

if (followBtn) followBtn.addEventListener('click', () => toggleFollow(followBtn.dataset.id, 'follow'));
if (unfollowBtn) unfollowBtn.addEventListener('click', () => toggleFollow(unfollowBtn.dataset.id, 'unfollow'));

const socket = io();
const userId = document.body.dataset.userid;

if (userId) {
  socket.emit('joinRoom', userId);
}

const notifIcon = document.getElementById('notificationIcon');
const notifDropdown = document.getElementById('notificationDropdown'); // تأكد من هذا الاسم في HTML
const notifBadge = document.getElementById('notificationBadge');

notifIcon.addEventListener('click', () => {
  if (notifDropdown.style.display === 'block') {
    notifDropdown.style.display = 'none';
  } else {
    notifDropdown.style.display = 'block';
    notifBadge.style.display = 'none'; // أخفى الشارة عند الفتح
  }
});

socket.on('newNotification', (data) => {
  notifBadge.style.display = 'inline';
  notifBadge.textContent = parseInt(notifBadge.textContent || '0') + 1;

  const item = document.createElement('div');
  item.className = 'notif-item';
  item.innerHTML = `
    <strong>${data.message}</strong><br>
    <a href="/posts/${data.postId}"> View post</a>
  `;
  notifDropdown.prepend(item);
});

















