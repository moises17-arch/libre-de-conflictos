/**
 * @file config/migrate.js
 * @description Ejecuta migraciones idempotentes de base de datos al iniciar el servidor.
 *
 * "Idempotente" significa que el script puede ejecutarse múltiples veces sin provocar
 * errores ni datos duplicados. Usa CREATE TABLE IF NOT EXISTS y ADD COLUMN IF NOT EXISTS
 * para que al arrancar el servidor siempre quede el esquema correcto, sin importar si
 * ya existía o no.
 *
 * Este archivo es invocado por index.js antes de que el servidor empiece a escuchar,
 * lo que garantiza que las tablas existen antes de recibir la primera petición.
 *
 * Conexiones:
 *  - ./db → pool de PostgreSQL para ejecutar las queries
 *  - Llamado desde ../index.js → función start()
 */

const pool = require('./db');

/**
 * Definición del esquema de tablas de la aplicación.
 *
 * Cada entrada del array contiene:
 *  - table:   nombre de la tabla
 *  - create:  sentencia SQL para crear la tabla si no existe
 *  - columns: lista de columnas para verificar que existan (migración incremental)
 */
const schema = [
  {
    // Tabla principal de usuarios.
    // Almacena nombre, email (único) y contraseña hasheada con bcrypt.
    // Nunca se guarda la contraseña en texto plano.
    table: 'users',
    create: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: [
      { name: 'name',       def: 'VARCHAR(100) NOT NULL' },
      { name: 'email',      def: 'VARCHAR(150)' },
      { name: 'password',   def: 'VARCHAR(255) NOT NULL' },
      { name: 'created_at', def: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
    ],
  },
  {
    // Tabla de tokens de refresco de larga duración (7 días).
    // ON DELETE CASCADE garantiza que si un usuario es eliminado,
    // todos sus refresh_tokens se borran automáticamente sin necesidad
    // de hacer un DELETE manual previo.
    table: 'refresh_tokens',
    create: `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(512) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: [
      { name: 'user_id',    def: 'INTEGER REFERENCES users(id) ON DELETE CASCADE' },
      { name: 'token',      def: 'VARCHAR(512) UNIQUE NOT NULL' },
      { name: 'expires_at', def: 'TIMESTAMP NOT NULL' },
      { name: 'created_at', def: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
    ],
  },
];

/**
 * Crea las tablas definidas en `schema` y agrega columnas faltantes.
 *
 * El loop itera sobre cada entrada del array `schema`:
 *  1. Ejecuta CREATE TABLE IF NOT EXISTS → crea la tabla si no existe.
 *  2. Consulta information_schema para saber qué columnas ya tiene la tabla.
 *  3. Para cada columna esperada, si no existe, ejecuta ALTER TABLE ADD COLUMN.
 *     Esto permite agregar columnas nuevas a instalaciones ya en producción
 *     sin tener que borrar y recrear la tabla (lo que perdería datos).
 *
 * Después del loop principal, verifica si las columnas start_time y end_time
 * de la tabla events son TIMESTAMP sin zona horaria y las convierte a TIMESTAMPTZ.
 * Esto es seguro porque todos los datos existentes ya están en UTC, así que
 * simplemente se les añade la etiqueta de zona horaria.
 *
 * @returns {Promise<void>}
 */
async function runMigrations() {
  for (const entry of schema) {
    // Crea la tabla si no existe; no hace nada si ya existe
    await pool.query(entry.create);

    // Obtiene la lista de columnas actuales de la tabla desde el catálogo de PostgreSQL
    const { rows } = await pool.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = $1',
      [entry.table]
    );
    // Convierte a array de strings para poder usar Array.includes() fácilmente
    const existing = rows.map((r) => r.column_name);

    for (const col of entry.columns) {
      // Solo agrega la columna si aún no existe; evita errores en bases de datos
      // que ya tienen el esquema actualizado
      if (!existing.includes(col.name)) {
        await pool.query(`ALTER TABLE ${entry.table} ADD COLUMN IF NOT EXISTS ${col.name} ${col.def}`);
        console.log(`Columna añadida: ${entry.table}.${col.name}`);
      }
    }

    console.log(`Tabla lista: ${entry.table}`);
  }

  // Migración de tipos: convierte TIMESTAMP (sin zona) a TIMESTAMPTZ (con zona horaria UTC).
  // Esto es necesario para que las comparaciones de fechas sean correctas cuando el servidor
  // y la base de datos están en diferentes zonas horarias.
  const timestampCols = [
    { table: 'events', column: 'start_time' },
    { table: 'events', column: 'end_time' },
  ];
  for (const { table, column } of timestampCols) {
    // Verifica el tipo actual de la columna en el catálogo antes de intentar la conversión
    const { rows: typeRows } = await pool.query(
      `SELECT data_type
       FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2`,
      [table, column]
    );
    if (typeRows.length > 0 && typeRows[0].data_type === 'timestamp without time zone') {
      // USING ... AT TIME ZONE 'UTC' indica a PostgreSQL que interprete los valores
      // existentes como si fueran UTC antes de añadirles la etiqueta de zona horaria
      await pool.query(
        `ALTER TABLE ${table} ALTER COLUMN ${column} TYPE TIMESTAMPTZ USING ${column} AT TIME ZONE 'UTC'`
      );
      console.log(`Columna convertida a TIMESTAMPTZ: ${table}.${column}`);
    }
  }
}

module.exports = runMigrations;
