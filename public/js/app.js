// public/js/app.js

const API_URL = '/api';

// ========== Глобальный перехват fetch (401 = авто-выход) ==========
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

  // Глобальная функция для обновления пользователя (вызывается из auth.js)
  window.updateUser = (newUser) => {
    currentUser = newUser;
    renderMenu();
    // Если пользователь только что авторизовался, перенаправляем на главную
    if (newUser) {
      window.location.hash = '#/home';
    }
  };

  renderMenu();

  // Запускаем роутер (только если Router существует)
  if (typeof Router !== 'undefined' && Router.init) {
    Router.init();
  } else {
    console.error('Router не найден!');
  }
}

function renderMenu() {
  const menuEl = document.getElementById('side-menu');
  if (!menuEl) return;

  if (!currentUser) {
    // Скрываем меню, если пользователь не авторизован
    menuEl.style.display = 'none';
    // Также можно скрыть другие элементы, если нужно
    return;
  }

  // Показываем меню
  menuEl.style.display = ''; // или 'block', если требуется

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

  // Обработчик выхода
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof Auth !== 'undefined' && Auth.logout) {
        Auth.logout();
      } else {
        localStorage.clear();
        window.location.hash = '#/login';
        renderMenu(); // скроет меню
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initApp);