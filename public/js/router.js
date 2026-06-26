const Router = {
  routes: {
    '/home': 'home.html',
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

  publicPages: [],
  adminPages: ['/admin', '/admin-users'],

  async init() {
    window.addEventListener('hashchange', () => this.handle());
    await this.handle();
  },

  async handle() {
    const hash = window.location.hash.slice(1) || '/home';
    const [base, param] = hash.split('/').filter(Boolean);
    const route = '/' + (base || 'home');

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // Если пользователь не авторизован — отправляем на чистую страницу логина
    if (!user) {
      window.location.href = '/login';
      return;
    }

    // Админ-страницы доступны только админу
    if (user.role !== 'admin' && this.adminPages.includes(route)) {
      window.location.hash = '#/home';
      return;
    }

    // Управление отображением меню
    const menuEl = document.getElementById('side-menu');
    if (menuEl) {
      menuEl.style.display = user ? '' : 'none';
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