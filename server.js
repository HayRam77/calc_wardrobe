// server.js
const express = require('express');
const path = require('path');
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
const systemsRouter = require('./routes/systems');
const materialsRouter = require('./routes/materials');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
const systemModulesRouter = require("./routes/systemModules");
app.use("/api/system-modules", systemModulesRouter);
app.use('/api/systems', systemsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/table-sort', require('./routes/table-sort'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработчик ошибок
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Сервер запущен на http://${HOST}:${PORT}`);
});
