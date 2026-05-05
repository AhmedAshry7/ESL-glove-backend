/* const express = require('express');
const cors = require('cors');
const modelRoutes = require('./routes/modelRoutes');
const subRoutes = require('./routes/subRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Link Routers
app.use('/api/models', modelRoutes);
app.use('/api/submissions', subRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)); */