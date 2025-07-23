<canvas id="postChart" width="200" height="200"></canvas>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
async function loadStats(postId) {
  const res = await fetch(`/posts/${postId}/statistics`);
  const data = await res.json();
  new Chart(document.getElementById('postChart'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(data.reactions),
      datasets: [{ data: Object.values(data.reactions), backgroundColor: ['#e74c3c','#f1c40f','#3498db'] }]
    }
  });
}
loadStats('<%= post._id %>');
</script>
