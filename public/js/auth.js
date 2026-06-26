// public/js/auth.js
const Auth = {
  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка входа');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (typeof window.updateUser === 'function') window.updateUser(data.user);
    return data.user;
  },
  async register(username, email, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка регистрации');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (typeof window.updateUser === 'function') window.updateUser(data.user);
    return data.user;
  },
  async changePassword(currentPassword, newPassword) {
    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка смены пароля');
    return data;
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof window.updateUser === 'function') window.updateUser(null);
    window.location.hash = '#/login';
  }
};