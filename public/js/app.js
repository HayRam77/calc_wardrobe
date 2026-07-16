// Файл: public/js/app.js
const API_BASE = '/api';

// Глобальные переменные
let currentUser = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
  // Проверяем авторизацию
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      currentUser = JSON.parse(userData);
    } catch (e) {
      console.error('Error parsing user data:', e);
      localStorage.removeItem('user');
    }
  }

  // Глобальный перехват fetch для добавления токена
  const originalFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }

    const response = await originalFetch(url, options);

    // Если получаем 401, разлогиниваем пользователя
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      currentUser = null;
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    return response;
  };

  // Инициализируем роутер
  if (typeof Router !== 'undefined') {
    await Router.init();
  }

  // Рендерим меню
  renderMenu();
});

// Рендеринг бокового меню
function renderMenu() {
  const menuEl = document.getElementById('side-menu');
  if (!menuEl) return;

  if (!currentUser) {
    menuEl.style.display = 'none';
    return;
  }

  menuEl.style.display = '';
  const menuList = menuEl.querySelector('ul');
  if (!menuList) return;

  const isAdmin = currentUser.role === 'admin';
  
  let menuHTML = `
    <li class="nav-item">
      <a class="nav-link" href="#/home">🏠 Главная</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#/projects">📋 Проекты</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#/manufacturers">🏭 Производители</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#/components">🔧 Компоненты</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#/automation">⚡ Автоматизация</a>
    </li>
  `;

  if (isAdmin) {
    menuHTML += `
      <li class="nav-item mt-3">
        <a class="nav-link" href="#/admin">👑 Администрирование</a>
      </li>
    `;
  }

  menuHTML += `
    <li class="nav-item mt-3">
      <a class="nav-link" href="#" onclick="logout()">🚪 Выход</a>
    </li>
  `;

  menuList.innerHTML = menuHTML;
}

// Выход из системы
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  window.location.href = '/login';
}
