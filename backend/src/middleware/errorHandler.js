/**
 * @file middleware/errorHandler.js
 * @description Middleware global de manejo de errores de Express.
 *
 * Express identifica un middleware de errores por su firma de 4 parámetros: (err, req, res, next).
 * Debe registrarse como el ÚLTIMO middleware en index.js (después de todas las rutas) para
 * que capture cualquier error que haya pasado por `next(err)` desde cualquier controlador.
 *
 * Su responsabilidad es:
 *  - Registrar el error completo (con stack trace) en los logs de Winston.
 *  - Devolver siempre una respuesta JSON estructurada y consistente al cliente.
 *  - Evitar que el stack trace (con rutas internas del servidor) llegue al cliente en producción.
 *
 * Conexiones:
 *  - Registrado en index.js como último middleware
 *  - Usa ./config/logger para registrar los errores
 *  - Recibe errores de cualquier controlador que llame a next(err)
 */

const logger = require('../config/logger');

/**
 * Captura errores no manejados y devuelve una respuesta JSON uniforme.
 *
 * @param {Error}  err  - Objeto de error capturado; puede tener propiedad `status` para el código HTTP
 * @param {import('express').Request}  req  - Petición HTTP original
 * @param {import('express').Response} res  - Respuesta HTTP donde se enviará el error
 * @param {import('express').NextFunction} next - Función de paso al siguiente middleware (no se usa aquí)
 * @returns {void}
 */
function errorHandler(err, req, res, next) {
  // Se registra el mensaje y el stack trace completo en los logs del servidor
  // para que el equipo de desarrollo pueda diagnosticar el problema
  logger.error({ message: err.message, stack: err.stack });

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    // El stack trace solo se incluye en desarrollo porque expone rutas internas del servidor
    // y detalles de implementación que un atacante podría aprovechar en producción
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = { errorHandler };
