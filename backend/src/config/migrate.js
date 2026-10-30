const pool = require('./db');

// Agrega columnas aquí para que se creen automáticamente al arrancar
const schema = [
  {
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

async function runMigrations() {
  for (const entry of schema) {
    await pool.query(entry.create);

    const { rows } = await pool.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = $1',
      [entry.table]
    );
    const existing = rows.map((r) => r.column_name);

    for (const col of entry.columns) {
      if (!existing.includes(col.name)) {
        await pool.query(`ALTER TABLE ${entry.table} ADD COLUMN IF NOT EXISTS ${col.name} ${col.def}`);
        console.log(`Columna añadida: ${entry.table}.${col.name}`);
      }
    }

    console.log(`Tabla lista: ${entry.table}`);
  }

  // Migrate start_time and end_time to TIMESTAMPTZ if they are still plain TIMESTAMP.
  // All existing data is in UTC so the cast is safe.
  const timestampCols = [
    { table: 'events', column: 'start_time' },
    { table: 'events', column: 'end_time' },
  ];
  for (const { table, column } of timestampCols) {
    const { rows: typeRows } = await pool.query(
      `SELECT data_type
       FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2`,
      [table, column]
    );
    if (typeRows.length > 0 && typeRows[0].data_type === 'timestamp without time zone') {
      await pool.query(
        `ALTER TABLE ${table} ALTER COLUMN ${column} TYPE TIMESTAMPTZ USING ${column} AT TIME ZONE 'UTC'`
      );
      console.log(`Columna convertida a TIMESTAMPTZ: ${table}.${column}`);
    }
  }
}

module.exports = runMigrations;
