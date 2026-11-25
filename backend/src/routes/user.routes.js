/**
 * @file routes/user.routes.js
 * @description Rutas protegidas de gestión de usuarios.
 *
 * Registra todos los endpoints relacionados con usuarios. TODAS las rutas de este
 * archivo requieren el middleware verifyToken, es decir, el cliente debe enviar
 * un access token válido en el header Authorization: Bearer <token>.
 *
 * Se monta en `/api/users` desde index.js: app.use('/api/users', userRoutes)
 *
 * ORDEN IMPORTANTE: Las rutas /profile deben registrarse ANTES que /:id.
 * Express evalúa las rutas en el orden en que se registran. Si /:id se registrara
 * primero, una petición a GET /api/users/profile haría que Express interprete
 * 'profile' como el valor del parámetro :id (un número esperado), lo que
 * causaría una consulta con id='profile' y probablemente un error de base de datos.
 *
 * Conexiones:
 *  - controllers/user.controller.js → maneja la lógica de cada endpoint
 *  - middleware/auth.middleware.js → verifyToken protege todas las rutas
 *  - Montado en index.js: app.use('/api/users', userRoutes)
 */

const { Router } = require('express');
const UserController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

// GET /api/users/profile
// Devuelve el perfil del usuario autenticado (datos del token, no de un :id en la URL).
// DEBE ir antes de /:id para que 'profile' no sea interpretado como un ID numérico.
router.get('/profile', verifyToken, UserController.getProfile);

// PUT /api/users/profile
// Actualiza nombre, email y opcionalmente la contraseña del usuario autenticado.
// DEBE ir antes de /:id por la misma razón que el GET anterior.
router.put('/profile', verifyToken, UserController.updateProfile);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Juan Pérez
 *         email:
 *           type: string
 *           example: juan@example.com
 *         created_at:
 *           type: string
 *           format: date-time
 *     UserInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: Juan Pérez
 *         email:
 *           type: string
 *           example: juan@example.com
 *         password:
 *           type: string
 *           example: secreto123
 *     UserUpdate:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           example: Juan Actualizado
 *         email:
 *           type: string
 *           example: juan2@example.com
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
// GET / eliminado — expone emails de todos los usuarios sin necesidad de negocio

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
 */
// GET /api/users/:id → busca un usuario por su ID numérico
router.get('/:id', verifyToken, UserController.getById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Email ya registrado
 */
// POST /api/users → crea un nuevo usuario (ruta administrativa; requiere token)
router.post('/', verifyToken, UserController.create);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 */
// PUT /api/users/:id → actualiza nombre y email; el controlador verifica ownership
router.put('/:id', verifyToken, UserController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       404:
 *         description: Usuario no encontrado
 */
// DELETE /api/users/:id → elimina la cuenta; el controlador verifica ownership
router.delete('/:id', verifyToken, UserController.remove);

module.exports = router;
