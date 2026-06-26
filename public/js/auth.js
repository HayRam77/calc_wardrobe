var authModal = document.getElementById('authModal');
var authBtn = document.getElementById('authBtn');

authBtn.addEventListener('click', function() {
    if (currentUser) {
        logout();
    } else {
        authModal.classList.add('active');
    }
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var username = document.getElementById('loginUsername').value;
    var password = document.getElementById('loginPassword').value;
    
    try {
        var response = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        var data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            authModal.classList.remove('active');
            authBtn.textContent = data.user.username;
            loadPageByPath(window.location.pathname);
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Ошибка соединения');
    }
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var username = document.getElementById('regUsername').value;
    var email = document.getElementById('regEmail').value;
    var password = document.getElementById('regPassword').value;
    
    try {
        var response = await fetch(API_BASE + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        var data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            authModal.classList.remove('active');
            authBtn.textContent = data.user.username;
            loadPageByPath(window.location.pathname);
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Ошибка соединения');
    }
});

async function logout() {
    var token = localStorage.getItem('token');
    await fetch(API_BASE + '/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    authBtn.textContent = 'Войти';
    loadPageByPath(window.location.pathname);
}

document.getElementById('switchToRegister').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
});

document.getElementById('switchToLogin').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});
