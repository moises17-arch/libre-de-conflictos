/**
 * @file index.js
 * @description Punto de entrada del servidor Express.
 *
 * Este archivo es el primero en ejecutarse. Se encarga de:
 *  1. Cargar variables de entorno desde el archivo .env (dotenv).
 *  2. Validar que las variables críticas estén definidas.
 *  3. Configurar todos los middlewares globales (seguridad, CORS, parsers, limitadores).
 *  4. Registrar el sistema de logging HTTP.
 *  5. Montar Swagger para la documentación interactiva de la API.
 *  6. Registrar las rutas de la aplicación.
 *  7. Ejecutar las migraciones de base de datos y arrancar el servidor.
 *
 * Conexiones:
 *  - ./config/swagger  → especificación OpenAPI generada automáticamente
 *  - ./config/migrate  → crea/actualiza las tablas antes de aceptar peticiones
 *  - ./routes/auth.routes    → rutas públicas de autenticación (/api/auth)
 *  - ./routes/user.routes    → rutas protegidas de usuarios (/api/users)
 *  - ./routes/event.routes   → rutas protegidas de eventos (/api/events)
 *  - ./middleware/errorHandler → captura todos los errores no manejados
 *  - ./config/logger → sistema de logs Winston
 */

require('dotenv').config();

// Variables de entorno obligatorias para que el servidor funcione correctamente.
// Sin JWT_SECRET no se puede firmar ni verificar ningún token.
// Sin las variables de base de datos no se puede conectar a PostgreSQL.
// Si falta alguna se aborta el proceso inmediatamente para evitar errores silenciosos.
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

const express = require('express');
const helmet = require('helmet');
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
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// helmet agrega cabeceras HTTP de seguridad (Content-Security-Policy, X-Frame-Options, etc.)
// para proteger contra ataques comunes como clickjacking e inyección de contenido.
app.use(helmet());

// CORS debe ir antes de cualquier otra cosa para que las peticiones OPTIONS del navegador
// (preflight) reciban la cabecera correcta antes de ser bloqueadas por otro middleware.
app.use(cors({
  origin: 'http://localhost:5173', // Solo permite peticiones desde el frontend en desarrollo
  credentials: true               // Necesario para que el navegador envíe/reciba cookies HttpOnly
}));

// Parsea el cuerpo de las peticiones con Content-Type: application/json
app.use(express.json());

// Parsea las cookies de la petición; necesario para leer el refreshToken HttpOnly
app.use(cookieParser());

// Límite global: máximo 500 peticiones por IP cada 15 minutos.
// Protege contra ataques de fuerza bruta y abuso general de la API.
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use(globalLimiter);

// Límite específico para rutas de autenticación: solo 10 intentos por IP en producción.
// En desarrollo se sube a 500 para no interrumpir las pruebas locales.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 500
});

// Middleware de logging HTTP: registra método, URL e IP de cada petición entrante.
// Usar el logger de Winston en vez de console.log para mantener el formato estructurado.
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip });
  next();
});

// Swagger UI disponible en /api-docs.
// swaggerSpec se genera automáticamente leyendo los comentarios JSDoc de las rutas.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Montaje de rutas de la aplicación.
// El authLimiter se aplica solo al grupo /api/auth porque es el más sensible.
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/auth', authLimiter, authRoutes);

// Ruta raíz de comprobación rápida: confirma que la API está corriendo
app.get('/', (req, res) => {
  res.json({ message: 'API corriendo con éxito', docs: '/api-docs' });
});

// Middleware global de errores (debe ser el ÚLTIMO middleware registrado).
// Express lo reconoce como handler de errores por recibir 4 parámetros (err, req, res, next).
app.use(errorHandler);

/**
 * Arranca el servidor de forma asíncrona.
 *
 * Ejecuta las migraciones de base de datos antes de empezar a escuchar peticiones,
 * garantizando que todas las tablas existan. Si las migraciones fallan, el proceso
 * termina con código de error para evitar arrancar con una base de datos incompleta.
 */
async function start() {
  try {
    // Las migraciones son idempotentes: pueden ejecutarse varias veces sin romper nada.
    // Se ejecutan aquí, antes de app.listen, para que el servidor no acepte peticiones
    // hasta que el esquema de base de datos esté actualizado.
    await runMigrations();
    app.listen(PORT, () => {
      logger.info(`Servidor en http://localhost:${PORT}`);
      logger.info(`Swagger en  http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    logger.error('Error al iniciar:', err.message);
    process.exit(1);
  }
}

start();
