// Login and registration pages
(async () => {
  const user = await initNav();
  const login = $('#loginForm'), reg = $('#regForm'), out = $('#msg');
  if (user && user.role === 'user') { location.href = 'afterlogin.html'; return; }
  const val = f => Object.fromEntries(new FormData(f));

  if (login) login.onsubmit = async e => {
    e.preventDefault();
    const v = val(login);
    if (!/^[6-9]\d{9}$/.test(v.mobile.trim())) return msg(out, 'Enter a valid 10-digit mobile number.');
    if (!v.password) return msg(out, 'Enter your password.');
    const b = $('button[type=submit]', login); b.disabled = true; b.textContent = 'Logging in…';
    try {
      await api('/api/auth/login', { method: 'POST', body: { mobile: v.mobile.trim(), password: v.password } });
      const next = new URLSearchParams(location.search).get('next');
      location.href = /^[A-Za-z]+\.html$/.test(next || '') ? next : 'afterlogin.html';
    } catch (err) { msg(out, err.message); b.disabled = false; b.textContent = 'Login'; }
  };

  if (reg) reg.onsubmit = async e => {
    e.preventDefault();
    const v = val(reg);
    if (v.name.trim().length < 2) return msg(out, 'Enter your full name.');
    if (!/^[6-9]\d{9}$/.test(v.mobile.trim())) return msg(out, 'Enter a valid 10-digit mobile number.');
    if (v.password.length < 8) return msg(out, 'Password must be at least 8 characters.');
    if (v.password !== v.confirmPassword) return msg(out, 'Passwords do not match.');
    const b = $('button[type=submit]', reg); b.disabled = true; b.textContent = 'Creating account…';
    try {
      await api('/api/auth/register', { method: 'POST', body: { name: v.name, mobile: v.mobile.trim(), password: v.password, confirmPassword: v.confirmPassword } });
      msg(out, 'Account created! Taking you to the login page…', true);
      setTimeout(() => location.href = 'login.html', 1500);
    } catch (err) { msg(out, err.message); b.disabled = false; b.textContent = 'Create Account'; }
  };
})();
