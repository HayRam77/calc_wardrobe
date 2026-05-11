require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const projectsRoutes = require('./routes/projects');
const blockTemplatesRoutes = require('./routes/blockTemplates');
const projectBlocksRoutes = require('./routes/projectBlocks');
const adminRoutes = require('./routes/admin');
const cabinetsRoutes = require('./routes/cabinets');
const cabinetsTopRoutes = require('./routes/cabinetsTop');
const componentTypesRoutes = require('./routes/componentTypes');
const manufacturersRoutes = require('./routes/manufacturers');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/block-templates', blockTemplatesRoutes);
app.use('/api/projects/:projectId/blocks', projectBlocksRoutes);
app.use('/api/projects/:projectId/cabinets', cabinetsRoutes);
app.use('/api/cabinets', cabinetsTopRoutes);
app.use('/api/component-types', componentTypesRoutes);
app.use('/api/manufacturers', manufacturersRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
