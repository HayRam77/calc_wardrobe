require('dotenv').config();
const express = require('express');
const cors = require('cors');
const catalogRoutes = require('./routes/catalog');
const authRoutes = require('./routes/auth');
const enclosuresRoutes = require('./routes/enclosures');
const projectsRoutes = require('./routes/projects');
const blockTemplatesRoutes = require('./routes/blockTemplates');
const projectBlocksRoutes = require('./routes/projectBlocks');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());

// Открытые маршруты
app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);

// Защищённые
app.use('/api/enclosures', enclosuresRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/block-templates', blockTemplatesRoutes);
app.use('/api/projects/:projectId/blocks', projectBlocksRoutes);

// Заглушка рассчёта (пока)
app.post('/api/calculate', require('./middleware/auth'), (req, res) => {
  res.json({ message: 'Расчёт принят', user: req.user.username });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
