/**
 * Auth page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (localStorage.getItem('nexus_token')) {
    window.location.href = 'pages/dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  const togglePassword = document.getElementById('togglePassword');

  // Toggle password visibility
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.textContent = type === 'password' ? '👁' : '🙈';
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    emailError.textContent = '';
    passwordError.textContent = '';
    loginError.classList.add('hidden');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let valid = true;
    if (!email || !email.includes('@')) {
      emailError.textContent = 'Enter a valid email address';
      valid = false;
    }
    if (!password || password.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters';
      valid = false;
    }
    if (!valid) return;

    const btnText = loginBtn.querySelector('.btn-text');
    const spinner = loginBtn.querySelector('.btn-spinner');
    btnText.textContent = 'Signing in...';
    spinner.classList.remove('hidden');
    loginBtn.disabled = true;

    try {
      const res = await NexusAPI.auth.login(email, password);
      if (res && res.success) {
        const { tokens, user } = res.data;
        NexusAPI.setToken(tokens.accessToken);
        localStorage.setItem('nexus_refresh', tokens.refreshToken);
        localStorage.setItem('nexus_user', JSON.stringify(user));
        window.location.href = 'pages/dashboard.html';
      }
    } catch (err) {
      const msg = err.error?.message || 'Login failed. Check your credentials.';
      loginError.textContent = msg;
      loginError.classList.remove('hidden');
    } finally {
      btnText.textContent = 'Sign In';
      spinner.classList.add('hidden');
      loginBtn.disabled = false;
    }
  });
});
