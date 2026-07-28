// server.js
require('dotenv').config();

const express = require('express');
const path = require('path');

// Импорт роутеров
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const cabinetsRouter = require('./routes/cabinets');
const blockTemplatesRouter = require('./routes/blockTemplates');
const componentTypesRouter = require('./routes/componentTypes');
const manufacturersRouter = require('./routes/manufacturers');
const parametersRouter = require('./routes/parameters');
const adminRouter = require('./routes/admin');
const systemComponentsRouter = require('./routes/systemComponents');
const systemComponentTypesRouter = require('./routes/systemComponentTypes');
const systemParametersRouter = require('./routes/systemParameters');
const systemParameterTypesRouter = require('./routes/systemParameterTypes');
const systemModulesRouter = require('./routes/systemModules');
const systemsRouter = require('./routes/systems');
const materialGroupsRouter = require('./routes/materialGroups');
const materialsRouter = require('./routes/materials');
const tableSortRouter = require('./routes/table-sort');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';

// Middleware парсинга тела запросов с увеличенным лимитом для дампов и импорта Excel
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// API маршруты
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/cabinets', cabinetsRouter);
app.use('/api/block-templates', blockTemplatesRouter);
app.use('/api/component-types', componentTypesRouter);
app.use('/api/manufacturers', manufacturersRouter);
app.use('/api/parameters', parametersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/system-components', systemComponentsRouter);
app.use('/api/system-component-types', systemComponentTypesRouter);
app.use('/api/system-parameters', systemParametersRouter);
app.use('/api/system-parameter-types', systemParameterTypesRouter);
app.use('/api/system-modules', systemModulesRouter);
app.use('/api/systems', systemsRouter);
app.use('/api/material-groups', materialGroupsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/table-sort', tableSortRouter);

// Защита: ненайденные API роуты возвращают JSON 404, а не HTML страницу
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API маршрут не найден' });
});

// SPA fallback (все остальные фронтенд-маршруты отдают index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Глобальный обработчик ошибок
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Сервер запущен на http://${HOST}:${PORT}`);
});