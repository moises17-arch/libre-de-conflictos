/**
 * @file middleware/auth.middleware.js
 * @description Middleware de autenticación JWT para rutas protegidas.
 *
 * Un middleware de Express es una función que se ejecuta entre la petición del cliente
 * y el controlador final. Este middleware en particular:
 *  1. Extrae el access token del header Authorization (formato: "Bearer <token>").
 *  2. Verifica la firma y la expiración del token usando JWT_SECRET.
 *  3. Si el token es válido, inyecta `{ id, email }` en `req.user` para que los
 *     controladores puedan saber quién hace la petición sin volver a consultar la BD.
 *  4. Si el token es inválido o no existe, responde con 401 Unauthorized y detiene
 *     la cadena de middlewares (no llama a `next()`).
 *
 * Uso: se agrega como segundo argumento en cualquier ruta que requiera autenticación.
 * Ejemplo: router.get('/profile', verifyToken, UserController.getProfile)
 *
 * Conexiones:
 *  - Usado en routes/user.routes.js y routes/event.routes.js
 *  - Alimenta req.user que leen auth.controller.js, user.controller.js y event.controller.js
 */

const jwt = require('jsonwebtoken');

/**
 * Verifica el token JWT del header Authorization y popula req.user.
 *
 * Se usa en todas las rutas protegidas que necesitan saber la identidad del usuario.
 * Sin este middleware, cualquier persona podría acceder a datos privados sin autenticarse.
 *
 * @param {import('express').Request}  req  - Petición HTTP; debe tener header Authorization: Bearer <token>
 * @param {import('express').Response} res  - Respuesta HTTP
 * @param {import('express').NextFunction} next - Función para continuar al siguiente middleware
 * @returns {void}
 */
function verifyToken(req, res, next) {
  // El header Authorization tiene el formato "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  // Se divide por espacio y se toma el segundo elemento (índice 1) para obtener solo el token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Si no viene el header o el token está vacío, se rechaza la petición de inmediato
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    // jwt.verify lanza una excepción si el token expiró, fue manipulado o la firma no coincide
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Se inyectan solo los campos necesarios (id y email) para no exponer el payload completo
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    // Cualquier error de verificación (expiración, firma inválida, token malformado)
    // se trata igual: se responde 401 sin revelar el motivo específico del fallo
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken };
