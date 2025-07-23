const socket = io();
  socket.emit('register', '<%= currentUser?._id %>');
  socket.on('newNotification', data => {
    alert(data.message);
  });

  document.querySelectorAll('.btn-like').forEach(btn => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.post-card');
      const postId = card.dataset.postId;
      const res = await fetch(`/posts/like/${postId}`, { method: 'POST' });
      const data = await res.json();
      btn.classList.toggle('bi-heart-fill');
      btn.classList.toggle('bi-heart');
      btn.classList.toggle('text-danger');
      card.querySelector('.likes-count').textContent = data.likesCount + ' إعجاب';
    });
  });

  document.querySelectorAll('.add-comment').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const postId = form.dataset.postId;
      const input = form.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      const res = await fetch(`/posts/comment/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const comments = await res.json();
      const section = form.previousElementSibling;
      section.innerHTML = comments.slice(0, 3).map(c => `<p><strong>${c.user.username}:</strong> ${c.text}</p>`).join('');
      input.value = '';
    });
  });

  document.querySelectorAll('.btn-bookmark').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.dataset.postId;
      const res = await fetch(`/posts/bookmark/${postId}`, { method: 'POST' });
      const data = await res.json();
      btn.classList.toggle('bi-bookmark-fill');
      btn.classList.toggle('bi-bookmark');
      btn.classList.toggle('text-primary');
    });
  });

  // Reactions
  document.querySelectorAll('.reaction-group').forEach(group => {
    const icon = group.querySelector('.toggle-reactions');
    const popup = group.querySelector('.reactions-popup');
    icon.addEventListener('click', () => popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex');
  });

  // Charts
 <% if (currentUser && currentUser._id.toString() === user._id.toString()) { %>
  <% posts.forEach(post => { %>
    new Chart(document.getElementById('chart-<%= post._id %>'), {
      type: 'bar',
      data: {
        labels: ['Likes', 'comments'],
        datasets: [{
          label: 'Interaction',
          data: [<%= post.likes.length %>, <%= post.comments.length %>],
          backgroundColor: ['#dc3545', '#0d6efd']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  <% }) %>
<% } %>


  document.querySelectorAll('.show-more-comments').forEach(button => {
    button.addEventListener('click', async () => {
      const postId = button.dataset.postId;
      const commentsSection = button.closest('.comments-section');

      try {
        const res = await fetch(`/posts/comments/${postId}`);
        const comments = await res.json();

        commentsSection.innerHTML = ''; // مسح القديم

        comments.forEach(comment => {
          commentsSection.innerHTML += `<p><strong>${comment.user.username}:</strong> ${comment.text}</p>`;
        });
      } catch (err) {
        console.error('Failed to load comments:', err);
        alert('Failed to load comments');
      }
    });
  });