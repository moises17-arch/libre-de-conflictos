require('dotenv').config();
const express = require('express');
const cors = require('cors'); // 1. Importar cors arriba
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const runMigrations = require('./config/migrate');
const userRoutes = require('./routes/user.routes');
const eventRoutes = require('./routes/event.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Activar CORS de primeras, antes de cualquier ruta o middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API corriendo con éxito', docs: '/api-docs' });
});

async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
      console.log(`Swagger en  http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Error al iniciar:', err.message);
    process.exit(1);
  }
}

start();