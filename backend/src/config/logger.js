/**
 * @file config/logger.js
 * @description Configura y exporta la instancia de Winston como sistema de logs.
 *
 * Winston es una librería de logging para Node.js que reemplaza a console.log porque:
 *  - Tiene niveles de severidad (error, warn, info, http, debug) para filtrar mensajes.
 *  - Soporta múltiples destinos (transports): consola, archivos, servicios externos.
 *  - Permite formato estructurado (JSON) para que herramientas como CloudWatch o
 *    Datadog puedan indexar y buscar los logs automáticamente.
 *  - Facilita desactivar logs de desarrollo en producción con un solo cambio de nivel.
 *
 * Conexiones:
 *  - Usado en index.js para logging HTTP.
 *  - Usado en middleware/errorHandler.js para registrar errores con stack trace.
 */

const winston = require('winston');
const { combine, timestamp, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: 'info', // Solo registra mensajes de nivel 'info' o superior (warn, error)
  format: process.env.NODE_ENV === 'production'
    // En producción: formato JSON para que los sistemas de log (CloudWatch, etc.)
    // puedan parsear y buscar los mensajes estructuralmente.
    ? combine(timestamp(), json())
    // En desarrollo: formato colorizado y legible por humanos en la terminal.
    : combine(colorize(), timestamp(), simple()),
  transports: [
    // Transport 1: Consola — muestra logs en tiempo real durante el desarrollo.
    new winston.transports.Console(),
    // Transport 2: Archivo de errores — persiste solo los mensajes de nivel 'error'.
    // Útil para revisar fallos pasados sin tener que escanear todos los logs.
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Transport 3: Archivo combinado — persiste todos los mensajes (info, warn, error).
    // Sirve como historial completo de actividad del servidor.
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

module.exports = logger;
