var API_BASE = '/api';
var currentUser = JSON.parse(localStorage.getItem('user') || 'null');
var authMode = 'login';

document.getElementById('burgerBtn').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

window.renderPage = async function(url) {
    const response = await fetch(url);
    const html = await response.text();
    const main = document.getElementById('main-content');
    main.innerHTML = html;
    
    var scripts = main.querySelectorAll('script');
    scripts.forEach(function(script) {
        var newScript = document.createElement('script');
        newScript.textContent = script.textContent;
        document.body.appendChild(newScript);
    });
};

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('spa-link')) {
        e.preventDefault();
        var href = e.target.getAttribute('href');
        history.pushState({}, '', href);
        loadPageByPath(href);
    }
});

window.addEventListener('popstate', function() {
    loadPageByPath(window.location.pathname);
});

function loadPageByPath(path) {
    var routes = {
        '/': '/pages/home.html',
        '/automation': '/pages/automation.html',
        '/components-systems': '/pages/components-systems.html',
        '/components-cabinets': '/pages/components-cabinets.html',
        '/manufacturers': '/pages/manufacturers.html',
        '/admin': '/pages/admin.html',
        '/admin/users': '/pages/admin-users.html'
    };
    
    if (path.startsWith('/project/')) {
        window.renderPage('/pages/project.html?id=' + path.split('/')[2]);
    } else if (path.startsWith('/cabinet/')) {
        window.renderPage('/pages/cabinet.html?id=' + path.split('/')[2]);
    } else {
        var page = routes[path] || '/pages/home.html';
        window.renderPage(page);
    }
}

if (currentUser) {
    document.getElementById('authBtn').textContent = currentUser.username;
}

loadPageByPath(window.location.pathname);
