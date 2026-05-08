#!/bin/bash
set -e
cd /opt/calc_wardrobe

echo "=== Остановка серверных процессов ==="
sudo fuser -k 3001/tcp 2>/dev/null || true
pm2 stop all 2>/dev/null || true

echo "=== Проверка прав БД ==="
DB_USER=$(grep DB_USER .env | cut -d'=' -f2)
sudo -u postgres psql -d bd_calc -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;" 2>/dev/null || true

echo "=== Исправление index.html (кэширование + IIFE) ==="
sed -i "s|fetch('/pages/' + file)|fetch('/pages/' + file + '?_=' + Date.now())|" public/index.html

echo "=== Полная замена всех страниц на корректные версии ==="
mkdir -p public/pages routes middleware

# ------------------ index.html (уже исправлен выше) ------------------

# ------------------ projects.html (Мои проекты) ------------------
cat > public/pages/projects.html << 'PAGE'
<h2>Мои проекты</h2>
<div id="myProjectsTable"></div>
<script>
(function() {
  let projectIdToDelete = null;

  async function loadMyProjects() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('myProjectsTable');
    if (!container) return;
    try {
      const res = await fetch('/api/projects', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const projects = await res.json();
      if (projects.length === 0) {
        container.innerHTML = '<p>У вас пока нет проектов. <a href="#" id="createLink">Создать новый</a></p>';
        const link = document.getElementById('createLink');
        if (link) link.addEventListener('click', (e) => { e.preventDefault(); navigateTo('/create-project'); });
        return;
      }
      let html = '<table><tr><th>Название</th><th>Название шкафа</th><th>Примечание</th><th>Создатель</th><th>Дата создания</th><th></th></tr>';
      projects.forEach(p => {
        html += `<tr>
          <td><a href="/project/${p.id}" class="project-link">${p.name}</a></td>
          <td>${p.cabinet_name || ''}</td>
          <td>${p.remark || ''}</td>
          <td>${p.created_by || ''}</td>
          <td>${new Date(p.created_at).toLocaleString('ru-RU')}</td>
          <td><button class="small danger delete-btn" data-id="${p.id}">Удалить</button></td>
        </tr>`;
      });
      html += '</table>';
      container.innerHTML = html;

      // Удаление
      container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          if (!confirm('Удалить проект?')) return;
          const token = localStorage.getItem('token');
          try {
            await fetch('/api/projects/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
            loadMyProjects();
          } catch(e) { alert('Ошибка удаления'); }
        });
      });
      // Переходы
      container.querySelectorAll('.project-link').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          navigateTo(this.getAttribute('href'));
        });
      });
    } catch(e) {
      container.innerHTML = '<p style="color:red;">Ошибка загрузки проектов</p>';
    }
  }
  loadMyProjects();
})();
</script>
PAGE

# ------------------ admin-all-projects.html (Все проекты) ------------------
cat > public/pages/admin-all-projects.html << 'PAGE'
<h2>Все проекты</h2>
<div id="allProjectsTable"></div>
<script>
(function() {
  async function loadAllProjects() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('allProjectsTable');
    if (!container) return;
    try {
      const res = await fetch('/api/projects', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const projects = await res.json();
      let html = '<table><tr><th>Название</th><th>Название шкафа</th><th>Примечание</th><th>Создатель</th><th>Дата создания</th><th></th></tr>';
      projects.forEach(p => {
        html += `<tr>
          <td><a href="/project/${p.id}" class="project-link">${p.name}</a></td>
          <td>${p.cabinet_name || ''}</td>
          <td>${p.remark || ''}</td>
          <td>${p.created_by || 'неизвестно'}</td>
          <td>${new Date(p.created_at).toLocaleString('ru-RU')}</td>
          <td><button class="small danger delete-btn" data-id="${p.id}">Удалить</button></td>
        </tr>`;
      });
      html += '</table>';
      container.innerHTML = html;

      container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          if (!confirm('Удалить проект?')) return;
          const token = localStorage.getItem('token');
          try {
            await fetch('/api/projects/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
            loadAllProjects();
          } catch(e) { alert('Ошибка удаления'); }
        });
      });
      container.querySelectorAll('.project-link').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          navigateTo(this.getAttribute('href'));
        });
      });
    } catch(e) {
      container.innerHTML = '<p style="color:red;">Ошибка загрузки</p>';
    }
  }
  loadAllProjects();
})();
</script>
PAGE

# ------------------ project-detail.html (проект со шкафами) ------------------
cat > public/pages/project-detail.html << 'PAGE'
<div id="projectContent">
  <div id="projectInfo">
    <h2 id="projectName"></h2>
    <p>Напряжение: <span id="projectVoltage"></span></p>
    <p>Создатель: <span id="projectCreator"></span></p>
    <p>Примечание: <span id="projectRemark"></span></p>
  </div>
  <h3>Шкафы</h3>
  <div id="cabinetsList"></div>
  <div style="margin-top:10px;">
    <input type="text" id="newCabinetName" placeholder="Название шкафа">
    <button id="addCabinetBtn">+ Добавить шкаф</button>
  </div>
  <div id="cabinetDetail" class="hidden" style="margin-top:20px; border:1px solid #ccc; padding:15px; background:#fafafa;">
    <h4>Шкаф: <span id="cabinetName"></span></h4>
    <div id="cabinetBlocks"></div>
    <button id="addBlockToCabinetBtn">+ Добавить компонент</button>
    <div id="blockForm" class="hidden" style="margin-top:10px;">
      <input type="text" id="blockNameInput" placeholder="Название компонента">
      <select id="templateSelect"><option value="">Без шаблона</option></select>
      <button id="saveBlockBtn">Добавить</button>
      <button id="cancelBlockBtn">Отмена</button>
      <div id="blockError" class="error"></div>
    </div>
  </div>
</div>
<script>
(function() {
  const pathParts = location.pathname.split('/');
  const projectId = pathParts[pathParts.length - 1];
  let cabinets = [];
  let selectedCabinetId = null;

  async function loadProject() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/projects/' + projectId, { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) throw new Error('Проект не найден');
      const project = await res.json();
      document.getElementById('projectName').textContent = project.name;
      document.getElementById('projectVoltage').textContent = project.voltage + ' В';
      document.getElementById('projectCreator').textContent = project.created_by || 'неизвестно';
      document.getElementById('projectRemark').textContent = project.remark || '';
    } catch(e) { document.getElementById('projectContent').innerHTML = '<p>Ошибка загрузки проекта</p>'; }
  }

  async function loadCabinets() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/projects/' + projectId + '/cabinets', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) throw new Error('Ошибка загрузки шкафов');
      cabinets = await res.json();
      renderCabinets();
    } catch(e) { document.getElementById('cabinetsList').innerHTML = '<p style="color:red;">Ошибка загрузки шкафов</p>'; }
  }

  function renderCabinets() {
    const container = document.getElementById('cabinetsList');
    if (cabinets.length === 0) { container.innerHTML = '<p>Нет шкафов</p>'; return; }
    let html = '<table><tr><th>Название</th><th>Действия</th></tr>';
    cabinets.forEach(cab => {
      html += `<tr>
        <td><a href="#" class="cabinet-link" data-id="${cab.id}">${cab.name}</a></td>
        <td>
          <button class="small edit-cabinet-btn" data-id="${cab.id}">✎</button>
          <button class="small danger delete-cabinet-btn" data-id="${cab.id}">🗑</button>
        </td>
      </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;

    container.querySelectorAll('.cabinet-link').forEach(link => {
      link.addEventListener('click', (e) => { e.preventDefault(); selectCabinet(link.dataset.id); });
    });
    container.querySelectorAll('.edit-cabinet-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const newName = prompt('Новое название шкафа:');
        if (newName) updateCabinet(btn.dataset.id, newName);
      });
    });
    container.querySelectorAll('.delete-cabinet-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Удалить шкаф и все его компоненты?')) return;
        const token = localStorage.getItem('token');
        await fetch('/api/projects/' + projectId + '/cabinets/' + btn.dataset.id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
        loadCabinets();
        document.getElementById('cabinetDetail').classList.add('hidden');
      });
    });
  }

  async function selectCabinet(id) {
    selectedCabinetId = id;
    document.getElementById('cabinetDetail').classList.remove('hidden');
    const cab = cabinets.find(c => c.id == id);
    if (cab) document.getElementById('cabinetName').textContent = cab.name;
    loadCabinetBlocks(id);
  }

  async function loadCabinetBlocks(cabinetId) {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/projects/' + projectId + '/blocks?cabinet_id=' + cabinetId, { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) throw new Error('Ошибка загрузки блоков');
      const blocks = await res.json();
      const container = document.getElementById('cabinetBlocks');
      if (blocks.length === 0) { container.innerHTML = '<p>Нет компонентов</p>'; return; }
      let html = '<table><tr><th>Название</th><th>Параметры</th></tr>';
      blocks.forEach(b => {
        const paramsStr = b.parameters.map(p => `${p.param_name}=${p.param_value}`).join('; ') || '—';
        html += `<tr><td>${b.block_name}</td><td>${paramsStr}</td></tr>`;
      });
      html += '</table>';
      container.innerHTML = html;
    } catch(e) { document.getElementById('cabinetBlocks').innerHTML = '<p style="color:red;">Ошибка</p>'; }
  }

  document.getElementById('addCabinetBtn').addEventListener('click', async () => {
    const name = document.getElementById('newCabinetName').value.trim();
    if (!name) return alert('Введите название шкафа');
    const token = localStorage.getItem('token');
    await fetch('/api/projects/' + projectId + '/cabinets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ name })
    });
    document.getElementById('newCabinetName').value = '';
    loadCabinets();
  });

  document.getElementById('addBlockToCabinetBtn').addEventListener('click', () => {
    document.getElementById('blockForm').classList.remove('hidden');
    const sel = document.getElementById('templateSelect');
    sel.innerHTML = '<option value="">Без шаблона</option>';
    if (typeof templates !== 'undefined') {
      templates.forEach(t => { const opt = document.createElement('option'); opt.value = t.id; opt.textContent = t.name; sel.appendChild(opt); });
    }
  });
  document.getElementById('cancelBlockBtn').addEventListener('click', () => { document.getElementById('blockForm').classList.add('hidden'); });
  document.getElementById('saveBlockBtn').addEventListener('click', async () => {
    const blockName = document.getElementById('blockNameInput').value.trim();
    if (!blockName) { document.getElementById('blockError').textContent = 'Введите название'; return; }
    const templateId = document.getElementById('templateSelect').value || null;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/projects/' + projectId + '/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ block_name: blockName, cabinet_id: selectedCabinetId, template_id: templateId, order_index: 0 })
      });
      if (!res.ok) { const err = await res.json(); document.getElementById('blockError').textContent = err.error || 'Ошибка'; return; }
      document.getElementById('blockForm').classList.add('hidden');
      loadCabinetBlocks(selectedCabinetId);
    } catch(e) { document.getElementById('blockError').textContent = 'Ошибка соединения'; }
  });

  async function updateCabinet(id, newName) {
    const token = localStorage.getItem('token');
    await fetch('/api/projects/' + projectId + '/cabinets/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ name: newName }) });
    loadCabinets();
  }

  loadProject();
  loadCabinets();
})();
</script>
PAGE

# ------------------ user-detail.html (исправлен redeclaration) ------------------
cat > public/pages/user-detail.html << 'PAGE'
<div id="userDetailContent">
  <h2>Пользователь: <span id="detailUsername"></span></h2>
  <div id="detailInfo"></div>
  <button onclick="history.back()" style="margin-top:15px;">← Назад</button>
</div>
<script>
(function() {
  const pathParts = location.pathname.split('/');
  const userId = pathParts[pathParts.length - 1];

  async function loadUserDetail() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/users/' + userId, { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const user = await res.json();
      document.getElementById('detailUsername').textContent = user.username;
      let html = `<p><strong>Роль:</strong> ${user.role}</p><p><strong>Статус:</strong> ${user.is_blocked ? 'Заблокирован' : 'Активен'}</p><p><strong>Дата создания:</strong> ${new Date(user.created_at).toLocaleString('ru-RU')}</p>`;
      html += '<h3>Проекты</h3>';
      if (user.projects && user.projects.length > 0) {
        html += '<ul>' + user.projects.map(p => `<li><a href="/project/${p.id}" class="project-link">${p.name}</a> (${p.voltage}В, создан ${new Date(p.created_at).toLocaleString('ru-RU')})</li>`).join('') + '</ul>';
      } else html += '<p>Нет проектов</p>';
      html += '<h3>Последние сессии</h3>';
      if (user.sessions && user.sessions.length > 0) {
        html += '<table><tr><th>Вход</th><th>Выход</th></tr>' + user.sessions.map(s => `<tr><td>${new Date(s.login_time).toLocaleString('ru-RU')}</td><td>${s.logout_time ? new Date(s.logout_time).toLocaleString('ru-RU') : '—'}</td></tr>`).join('') + '</table>';
      } else html += '<p>Нет данных</p>';
      document.getElementById('detailInfo').innerHTML = html;
      document.querySelectorAll('.project-link').forEach(link => { link.addEventListener('click', function(e) { e.preventDefault(); navigateTo(this.getAttribute('href')); }); });
    } catch(e) { document.getElementById('userDetailContent').innerHTML = '<p style="color:red;">Ошибка загрузки данных пользователя</p>'; }
  }
  loadUserDetail();
})();
</script>
PAGE

# ------------------ admin-users.html (исправлен navigateTo) ------------------
cat > public/pages/admin-users.html << 'PAGE'
<h2>Управление пользователями</h2>
<div id="usersTable"></div>
<script>
(function() {
  async function loadUsers() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('usersTable');
    if (!container) return;
    try {
      const res = await fetch('/api/admin/users', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const users = await res.json();
      const currentUser = JSON.parse(localStorage.getItem('user'));
      let html = '<table><tr><th>ID</th><th>Имя</th><th>Роль</th><th>Статус</th><th>Создан</th><th>Действия</th></tr>';
      users.forEach(u => {
        const isSelf = currentUser && currentUser.id === u.id;
        const isAdmin = u.role === 'admin';
        const deleteDisabled = isSelf || isAdmin;
        html += `<tr>
          <td>${u.id}</td>
          <td><a href="#" class="user-detail-link" data-id="${u.id}">${u.username}</a></td>
          <td>${u.role}</td>
          <td>${u.is_blocked ? 'Заблокирован' : 'Активен'}</td>
          <td>${new Date(u.created_at).toLocaleString('ru-RU')}</td>
          <td>
            <button class="small block-btn" data-id="${u.id}">${u.is_blocked ? 'Разблок.' : 'Блокир.'}</button>
            <button class="small reset-btn" data-id="${u.id}">Сброс пароля</button>
            <button class="small danger delete-btn" data-id="${u.id}" ${deleteDisabled ? 'disabled' : ''}>Удалить</button>
          </td>
        </tr>`;
      });
      html += '</table>';
      container.innerHTML = html;

      container.querySelectorAll('.block-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          await fetch('/api/admin/users/' + id + '/block', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
          loadUsers();
        });
      });
      container.querySelectorAll('.reset-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          const newPass = prompt('Введите новый пароль (не менее 4 символов):');
          if (!newPass) return;
          await fetch('/api/admin/users/' + id + '/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ newPassword: newPass })
          });
          alert('Пароль изменён');
        });
      });
      container.querySelectorAll('.delete-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          if (!confirm('Удалить пользователя?')) return;
          try {
            const res = await fetch('/api/admin/users/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
            if (!res.ok) { const err = await res.json(); alert(err.error || 'Ошибка удаления'); return; }
            loadUsers();
          } catch(e) { alert('Ошибка соединения'); }
        });
      });
      container.querySelectorAll('.user-detail-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const userId = link.dataset.id;
          navigateTo('/admin/users/' + userId);
        });
      });
    } catch(e) {
      container.innerHTML = '<p style="color:red;">Ошибка загрузки пользователей</p>';
    }
  }
  loadUsers();
})();
</script>
PAGE

echo "=== Очистка неиспользуемых роутов ==="
rm -f routes/catalog.js routes/enclosures.js

echo "=== Проверка синтаксиса JS-файлов ==="
for f in $(find . -name "*.js" -not -path "./node_modules/*"); do
  node --check "$f" 2>/dev/null && echo "✔ $f" || echo "✘ Ошибка в $f"
done

echo "=== Запуск сервера ==="
node server.js
