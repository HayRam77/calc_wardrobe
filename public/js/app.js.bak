// public/js/app.js

const API_URL = '/api';

// Глобальный перехват fetch (401 = авто-выход)
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = options.headers || {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  options.headers = headers;

  const response = await originalFetch(url, options);

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = '#/login';
    throw new Error('Unauthorized');
  }

  return response;
};

let currentUser = null;

function initApp() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (token && user) {
    currentUser = user;
  }

  window.updateUser = (newUser) => {
    currentUser = newUser;
    renderMenu();
    if (newUser) {
      window.location.hash = '#/home';
    }
  };

  renderMenu();

  // Запуск роутера только после определения меню
  if (typeof Router !== 'undefined' && Router.init) {
    Router.init();
  }
}

function renderMenu() {
  const menuEl = document.getElementById('side-menu');
  if (!menuEl) return;

  if (!currentUser) {
    menuEl.innerHTML = '';           // очищаем меню
    menuEl.style.display = 'none';  // скрываем блок
    return;
  }

  menuEl.style.display = ''; // показываем
  let html = `
    <a href="#/home">🏠 Главная</a>
    <a href="#/projects">📁 Проекты</a>
    <a href="#/manufacturers">🏭 Производители</a>
    <a href="#/components">🧩 Компоненты</a>
    <a href="#/automation">⚙️ Автоматизация</a>
  `;

  if (currentUser.role === 'admin') {
    html += `<a href="#/admin">👑 Администрирование</a>`;
  }

  html += `<a href="#" id="logout-btn">🚪 Выход (${currentUser.username})</a>`;
  menuEl.innerHTML = html;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof Auth !== 'undefined' && Auth.logout) {
        Auth.logout();
      } else {
        localStorage.clear();
        window.location.hash = '#/login';
        renderMenu();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initApp);