/**
 * @file routes/auth.routes.js
 * @description Rutas públicas de autenticación.
 *
 * Registra los endpoints de autenticación. Estas rutas NO requieren token JWT
 * porque son el mecanismo para obtenerlo. Se montan en `/api/auth` desde index.js.
 *
 * El rate limiter de autenticación (authLimiter) se aplica a todo este grupo de rutas
 * en index.js, limitando los intentos de login/registro a 10 por IP en producción.
 *
 * Conexiones:
 *  - controllers/auth.controller.js → maneja la lógica de cada endpoint
 *  - Montado en index.js: app.use('/api/auth', authLimiter, authRoutes)
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

// POST /api/auth/register
// Registra un nuevo usuario. Recibe { name, email, password } en el body.
// Responde con el access token y establece la cookie del refresh token.
router.post('/register', AuthController.register);

// POST /api/auth/login
// Autentica un usuario existente. Recibe { email, password } en el body.
// Responde con el access token y renueva la cookie del refresh token.
router.post('/login', AuthController.login);

// POST /api/auth/refresh
// Genera un nuevo access token usando el refresh token de la cookie HttpOnly.
// No requiere body; lee el token de la cookie automáticamente.
router.post('/refresh', AuthController.refresh);

// POST /api/auth/logout
// Cierra la sesión del usuario: elimina el refresh token de la BD y limpia la cookie.
// No requiere body; lee el token de la cookie automáticamente.
router.post('/logout', AuthController.logout);

module.exports = router;
