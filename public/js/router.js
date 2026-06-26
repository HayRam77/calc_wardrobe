// public/js/router.js

const Router = {
  routes: {
    '/home': 'home.html',
    '/login': 'login.html',
    '/register': 'register.html',
    '/projects': 'projects.html',
    '/project': 'project.html',
    '/cabinet': 'cabinet.html',
    '/manufacturers': 'manufacturers.html',
    '/components': 'components-cabinets.html',
    '/components-systems': 'components-systems.html',
    '/automation': 'automation.html',
    '/admin': 'admin.html',
    '/admin-users': 'admin-users.html'
  },

  publicPages: ['/login', '/register'],
  adminPages: ['/admin', '/admin-users'],

  async init() {
    window.addEventListener('hashchange', () => this.handle());
    await this.handle();
  },

  async handle() {
    const hash = window.location.hash.slice(1) || '/home';
    const [base, param] = hash.split('/').filter(Boolean);
    const route = '/' + (base || 'home');
    const fullPath = param ? `/${base}/${param}` : route;

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // Проверка авторизации для защищённых страниц
    if (!user && !this.publicPages.includes(route)) {
      window.location.hash = '#/login';
      return;
    }

    // Проверка прав администратора
    if (user && user.role !== 'admin' && this.adminPages.includes(route)) {
      window.location.hash = '#/home';
      return;
    }

    // Управление видимостью меню (публичные страницы — без меню)
    const menuEl = document.getElementById('side-menu');
    if (menuEl) {
      if (!user || this.publicPages.includes(route)) {
        menuEl.style.display = 'none';
      } else {
        menuEl.style.display = '';
      }
    }

    const pageFile = this.routes[route];
    if (!pageFile) {
      document.getElementById('app-content').innerHTML = '<h2>Страница не найдена</h2>';
      return;
    }

    try {
      const res = await fetch(`/pages/${pageFile}`);
      if (!res.ok) throw new Error('Ошибка загрузки');
      const html = await res.text();
      document.getElementById('app-content').innerHTML = html;
      window.pageParam = param || null;

      if (typeof window.pageInit === 'function') {
        window.pageInit();
      }
    } catch (err) {
      console.error(err);
      document.getElementById('app-content').innerHTML = '<h2>Ошибка загрузки страницы</h2>';
    }
  }
};