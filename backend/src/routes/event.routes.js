/**
 * @file routes/event.routes.js
 * @description Rutas protegidas de gestión de eventos.
 *
 * Registra todos los endpoints de eventos. TODAS las rutas requieren verifyToken,
 * por lo que el cliente debe enviar un access token válido.
 *
 * Se monta en `/api/events` desde index.js: app.use('/api/events', eventRoutes)
 *
 * ORDEN IMPORTANTE: Las rutas /stats y /user/:userId deben registrarse ANTES que /:id.
 * Si /:id se registrara primero, Express trataría 'stats' y 'user' como valores
 * del parámetro :id. Por ejemplo, GET /api/events/stats sería interpretado como
 * GET /api/events/:id con id='stats', lo que fallaría al buscar un evento con ese ID.
 *
 * Conexiones:
 *  - controllers/event.controller.js → maneja la lógica de cada endpoint
 *  - middleware/auth.middleware.js → verifyToken protege todas las rutas
 *  - Montado en index.js: app.use('/api/events', eventRoutes)
 */

const { Router } = require('express');
const EventController = require('../controllers/event.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

// GET /api/events/stats
// Devuelve estadísticas del usuario autenticado: total, próximos y activos.
// DEBE ir antes de /:id para que 'stats' no sea interpretado como un ID.
router.get('/stats', verifyToken, EventController.getStats);

// POST /api/events
// Crea un nuevo evento para el usuario autenticado.
// Recibe { title, description, startTime, endTime, timezone } en el body.
// Responde 409 si el horario choca con un evento existente del mismo usuario.
router.post('/', verifyToken, EventController.create);

// GET /api/events/user/:userId
// Devuelve los eventos paginados del usuario especificado en :userId.
// El controlador verifica que :userId coincida con el id del token (no se pueden ver
// eventos ajenos). Acepta query params: ?page=1&limit=20
// DEBE ir antes de /:id para que 'user' no sea interpretado como un ID.
router.get('/user/:userId', verifyToken, EventController.getByUser);

// PUT /api/events/:id
// Actualiza un evento por su ID. El servicio verifica ownership y conflictos de horario.
// Responde 403/404 si el evento no existe o no pertenece al usuario.
router.put('/:id', verifyToken, EventController.update);

// DELETE /api/events/:id
// Elimina un evento por su ID. El servicio verifica que pertenezca al usuario autenticado.
router.delete('/:id', verifyToken, EventController.remove);

module.exports = router;
