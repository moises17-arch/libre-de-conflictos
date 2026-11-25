/**
 * @file controllers/auth.controller.js
 * @description Controlador de autenticación con sistema de doble token.
 *
 * Implementa el flujo de autenticación con dos tipos de tokens:
 *
 *  - Access Token (JWT, 15 minutos):
 *    Se devuelve en el cuerpo de la respuesta JSON. El frontend lo guarda en memoria
 *    o localStorage y lo envía en el header Authorization: Bearer <token>.
 *    Tiene vida corta para limitar el daño si es interceptado.
 *
 *  - Refresh Token (JWT, 7 días):
 *    Se guarda en la base de datos (tabla refresh_tokens) y se envía al navegador
 *    como cookie HttpOnly. Al ser HttpOnly, JavaScript del cliente NO puede leerlo,
 *    lo que protege contra ataques XSS (Cross-Site Scripting) donde código malicioso
 *    intenta robar tokens. Cuando el access token expira, el cliente llama a /refresh
 *    y obtiene uno nuevo sin volver a pedir usuario y contraseña.
 *
 * Conexiones:
 *  - UserModel (models/user.model.js) → buscar y crear usuarios
 *  - pool (config/db.js) → guardar y verificar refresh tokens directamente
 *  - Rutas registradas en routes/auth.routes.js
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const pool = require('../config/db');
const UserModel = require('../models/user.model');

// Esquema de validación para el registro: nombre no vacío, email válido, contraseña mínima 6 chars
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

// Esquema de validación para el login: email válido, contraseña no vacía
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

/**
 * Genera un par de tokens (access + refresh) firmados con los secrets del entorno.
 *
 * @param {{ id: number, email: string }} user - Datos del usuario a incluir en el payload
 * @returns {{ accessToken: string, refreshToken: string }} Par de tokens JWT
 */
function generateTokens(user) {
  // Access token de corta duración: se renueva automáticamente vía /refresh
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  // Refresh token de larga duración: firmado con un secret diferente para mayor seguridad
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

/**
 * Persiste el refresh token en la base de datos con su fecha de expiración.
 *
 * Guardar el token en BD permite revocarlo explícitamente en el logout o al detectar
 * actividad sospechosa, algo que no es posible solo con la firma JWT.
 *
 * @param {number} userId - ID del usuario dueño del token
 * @param {string} token  - Valor del refresh token a guardar
 * @returns {Promise<void>}
 */
async function saveRefreshToken(userId, token) {
  // Calcula la fecha de expiración: 7 días desde ahora en milisegundos
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
}

/**
 * Opciones de la cookie del refresh token.
 *
 * - httpOnly: true  → el navegador impide que JavaScript acceda a esta cookie,
 *                      bloqueando su robo mediante ataques XSS.
 * - sameSite: 'strict' → la cookie solo se envía en peticiones desde el mismo origen,
 *                        protegiendo contra ataques CSRF.
 * - secure: solo en producción → requiere HTTPS; en desarrollo se desactiva para
 *           permitir peticiones HTTP locales sin certificado.
 * - maxAge: 7 días en milisegundos → el navegador borra la cookie automáticamente al expirar.
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

/**
 * Registra un nuevo usuario en el sistema.
 *
 * Flujo:
 *  1. Valida el cuerpo con Zod (nombre, email válido, contraseña ≥ 6 chars).
 *  2. Verifica que el email no esté ya registrado.
 *  3. Crea el usuario (UserModel.create hashea la contraseña internamente con bcrypt).
 *  4. Genera y guarda un par de tokens, establece la cookie y responde con el access token.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function register(req, res, next) {
  try {
    // Zod valida la forma y los tipos; safeParse devuelve { success, data } o { success, error }
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.errors });

    const { name, email, password } = parsed.data;

    // Verificación de email duplicado antes de intentar el INSERT,
    // para devolver un mensaje claro en vez del error de constraint de PostgreSQL
    const existing = await UserModel.findByEmail(email);
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });

    // UserModel.create hashea la contraseña con bcrypt (factor 10) antes de guardarla
    const user = await UserModel.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.id, refreshToken);

    // El refresh token se envía solo como cookie HttpOnly; nunca aparece en el JSON de respuesta
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.status(201).json({ success: true, accessToken, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
}

/**
 * Autentica un usuario existente y devuelve un nuevo par de tokens.
 *
 * Flujo:
 *  1. Valida el cuerpo con Zod.
 *  2. Busca el usuario por email.
 *  3. Compara la contraseña con bcrypt.
 *  4. Genera tokens, guarda el refresh token y establece la cookie.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.errors });

    const { email, password } = parsed.data;

    // findByEmail devuelve la fila completa incluyendo password (SELECT *) para poder comparar
    const user = await UserModel.findByEmail(email);

    // Se usa el mismo mensaje genérico 'Invalid credentials' tanto si el email no existe
    // como si la contraseña es incorrecta. Esto evita que un atacante pueda averiguar
    // qué emails están registrados probando combinaciones (enumeración de usuarios).
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // bcrypt.compare compara el texto plano con el hash almacenado de forma segura
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.id, refreshToken);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ success: true, accessToken, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
}

/**
 * Genera un nuevo access token usando el refresh token de la cookie.
 *
 * La verificación es doble para mayor seguridad:
 *  1. Verifica que el token exista en la base de datos y no haya expirado.
 *     Esto permite invalidar tokens revocando la fila de la BD (logout).
 *  2. Verifica la firma JWT con JWT_REFRESH_SECRET para confirmar que no fue manipulado.
 *
 * Solo devuelve un nuevo access token; el refresh token se reutiliza hasta que expire
 * o el usuario haga logout explícito.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function refresh(req, res, next) {
  try {
    // El refresh token llega en la cookie HttpOnly; no puede leerlo JavaScript del cliente
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });

    // Primera verificación: el token debe existir en la BD y no haber expirado
    const row = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()', [token]);
    if (row.rowCount === 0) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    // Segunda verificación: la firma JWT debe ser válida (no fue manipulado el token)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Se genera solo un nuevo access token; el refresh token no cambia
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ success: true, accessToken });
  } catch (err) { next(err); }
}

/**
 * Cierra la sesión del usuario.
 *
 * Elimina el refresh token de la base de datos para invalidarlo definitivamente
 * (aunque el token JWT aún no haya expirado, ya no podrá usarse para obtener nuevos
 * access tokens). Luego limpia la cookie del navegador.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function logout(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (token) {
      // Elimina el refresh token de la BD para invalidarlo; cualquier intento posterior
      // de usarlo fallará en la verificación de existencia del endpoint /refresh
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    }
    // Borra la cookie del navegador usando las mismas opciones con que fue creada
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
}

module.exports = { register, login, refresh, logout };
