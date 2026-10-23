require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const runMigrations = require('./config/migrate');
const userRoutes = require('./routes/user.routes');
const eventRoutes = require('./routes/event.routes');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS before anything else
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Global rate limiter
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(globalLimiter);

// Auth-specific rate limiter (stricter)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/auth', authLimiter, authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API corriendo con éxito', docs: '/api-docs' });
});

// Global error handler (must be last)
app.use(errorHandler);

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
