/**
 * @file config/db.js
 * @description Configura y exporta el pool de conexiones a PostgreSQL.
 *
 * Un pool de conexiones mantiene un conjunto de conexiones abiertas y reutilizables.
 * En vez de abrir y cerrar una conexión nueva por cada petición HTTP (operación costosa),
 * el pool entrega una conexión libre del conjunto y la devuelve al terminar.
 * Esto mejora la escalabilidad porque el servidor puede atender muchas peticiones
 * simultáneas sin superar el límite de conexiones que acepta PostgreSQL.
 *
 * Conexiones:
 *  - Usado por todos los modelos, repositorios y servicios que necesitan consultar la BD.
 *  - Se configura con las variables de entorno definidas en .env y validadas en index.js.
 */

const { Pool } = require('pg');
require('dotenv').config();

// Crea el pool con las credenciales de la base de datos tomadas de variables de entorno.
// Nunca se escriben contraseñas directamente en el código fuente.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Listener de errores del pool: captura errores en conexiones inactivas (idle).
// Sin este listener, un error inesperado en una conexión en reposo podría
// romper el proceso de Node.js sin ningún mensaje explicativo.
pool.on('error', (err) => {
  console.error('Error en el pool de PostgreSQL:', err);
});

module.exports = pool;
