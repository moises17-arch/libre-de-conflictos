/**
 * @file models/user.model.js
 * @description Modelo de acceso a datos para la tabla users.
 *
 * Esta capa es responsable exclusivamente de las queries SQL sobre la tabla users.
 * Encapsula el hashing de contraseñas para garantizar que nunca se guarden en texto plano.
 *
 * Conexiones:
 *  - config/db.js → pool de conexiones PostgreSQL
 *  - Usado por controllers/auth.controller.js → registro y login
 *  - Usado por controllers/user.controller.js → operaciones CRUD de usuarios
 */

const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const UserModel = {

  /**
   * Devuelve todos los usuarios registrados, sin incluir la contraseña.
   *
   * @returns {Promise<object[]>} Lista de usuarios con id, name, email, created_at
   */
  async findAll() {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users ORDER BY id'
    );
    return rows;
  },

  /**
   * Busca un usuario por su ID.
   *
   * No devuelve la contraseña (SELECT específico de columnas) para que el resultado
   * pueda enviarse directamente al cliente sin riesgo de exponer el hash.
   *
   * @param {number|string} id - ID del usuario a buscar
   * @returns {Promise<object|null>} El usuario encontrado o null si no existe
   */
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Busca un usuario por su dirección de email.
   *
   * Usa SELECT * (incluye la columna password con el hash bcrypt) porque este método
   * es llamado desde el login, donde se necesita la contraseña hasheada para
   * compararla con la que el usuario ingresó usando bcrypt.compare.
   *
   * @param {string} email - Email a buscar
   * @returns {Promise<object|null>} El usuario completo (con password hasheada) o null
   */
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Crea un nuevo usuario hasheando su contraseña antes de guardarla.
   *
   * bcrypt con factor de costo 10 genera un hash de 60 caracteres.
   * El factor 10 significa que el algoritmo realiza 2^10 (1024) iteraciones,
   * lo cual lo hace computacionalmente costoso a propósito: dificulta los ataques de
   * fuerza bruta porque cada intento tarda decenas de milisegundos en lugar de microsegundos.
   *
   * @param {object} data           - Datos del nuevo usuario
   * @param {string} data.name      - Nombre completo
   * @param {string} data.email     - Email (debe ser único en la tabla)
   * @param {string} data.password  - Contraseña en texto plano (se hashea aquí)
   * @returns {Promise<object>} El usuario creado sin la contraseña (id, name, email, created_at)
   */
  async create({ name, email, password }) {
    // bcrypt.hash aplica el algoritmo de hashing con 10 rondas de salting
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, hashed]
    );
    return rows[0];
  },

  /**
   * Actualiza nombre y email de un usuario (sin cambiar la contraseña).
   *
   * @param {number|string} id  - ID del usuario a actualizar
   * @param {object} data       - Nuevos valores
   * @param {string} data.name  - Nuevo nombre
   * @param {string} data.email - Nuevo email
   * @returns {Promise<object|null>} El usuario actualizado o null si no existe
   */
  async update(id, { name, email }) {
    const { rows } = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, created_at',
      [name, email, id]
    );
    return rows[0] || null;
  },

  /**
   * Actualiza nombre, email y opcionalmente la contraseña de un usuario.
   *
   * Si se proporciona una nueva contraseña, se rehashea antes de guardarla.
   * Nunca se guarda una contraseña en texto plano, ni siquiera al actualizarla.
   *
   * @param {number|string} id    - ID del usuario a actualizar
   * @param {object} data         - Nuevos valores
   * @param {string} data.name    - Nuevo nombre
   * @param {string} data.email   - Nuevo email
   * @param {string} [data.password] - Nueva contraseña en texto plano (opcional)
   * @returns {Promise<object|null>} El usuario actualizado o null si no existe
   */
  async updateWithPassword(id, { name, email, password }) {
    if (password) {
      // Se rehashea la nueva contraseña con el mismo factor de costo que en create
      // para mantener la misma resistencia a fuerza bruta
      const hashed = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        'UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4 RETURNING id, name, email, created_at',
        [name, email, hashed, id]
      );
      return rows[0] || null;
    }
    // Si no se proporciona contraseña nueva, delega en update (que no toca la columna password)
    return this.update(id, { name, email });
  },

  /**
   * Elimina un usuario por su ID.
   *
   * Gracias a ON DELETE CASCADE en la tabla refresh_tokens, al eliminar un usuario
   * también se eliminan automáticamente todos sus tokens de sesión.
   *
   * @param {number|string} id - ID del usuario a eliminar
   * @returns {Promise<object|null>} El ID del usuario eliminado, o null si no existía
   */
  async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = UserModel;
