// public/js/auth.js

const Auth = {
  /**
   * Авторизация пользователя
   */
  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Ошибка входа');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Обновляем состояние в app.js
    if (typeof window.updateUser === 'function') {
      window.updateUser(data.user);
    }

    return data.user;
  },

  /**
   * Регистрация нового пользователя
   */
  async register(username, email, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Ошибка регистрации');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (typeof window.updateUser === 'function') {
      window.updateUser(data.user);
    }

    return data.user;
  },

  /**
   * Смена пароля
   */
  async changePassword(currentPassword, newPassword) {
    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Ошибка смены пароля');
    }
    return data;
  },

  /**
   * Выход
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof window.updateUser === 'function') {
      window.updateUser(null);
    }
    window.location.hash = '#/login';
  }
};