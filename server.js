require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { authenticateToken } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const blockTemplateRoutes = require('./routes/blockTemplates');
const cabinetRoutes = require('./routes/cabinets');
const componentTypeRoutes = require('./routes/componentTypes');
const manufacturerRoutes = require('./routes/manufacturers');
const parameterRoutes = require('./routes/parameters');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/block-templates', authenticateToken, blockTemplateRoutes);
app.use('/api/cabinets', authenticateToken, cabinetRoutes);
app.use('/api/component-types', authenticateToken, componentTypeRoutes);
app.use('/api/manufacturers', authenticateToken, manufacturerRoutes);
app.use('/api/parameters', authenticateToken, parameterRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
