/**
 * Auth Guard - runs on every protected page
 */

(function () {
  const token = localStorage.getItem('nexus_token');
  if (!token) {
    window.location.href = '../index.html';
    return;
  }

  // Setup logout
  document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');

    const user = JSON.parse(localStorage.getItem('nexus_user') || '{}');
    if (userInfo && user.email) {
      userInfo.innerHTML = `<strong>${user.firstName || ''} ${user.lastName || ''}</strong><br/><small>${user.role || ''}</small>`;
    }

    const userName = document.getElementById('userName');
    if (userName) userName.textContent = user.firstName || 'User';

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await NexusAPI.auth.logout();
        } catch (_) { }
        NexusAPI.clearToken();
        window.location.href = '../index.html';
      });
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target)) sidebar.classList.remove('open');
      });
    }
  });
})();
