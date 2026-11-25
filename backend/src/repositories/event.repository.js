/**
 * @file repositories/event.repository.js
 * @description Repositorio de acceso a datos para la tabla events.
 *
 * Implementa el patrón Repositorio: encapsula todas las queries SQL relacionadas
 * con eventos en un único lugar, separándolas de la lógica de negocio.
 *
 * Beneficios de este patrón:
 *  - Mantenimiento: si cambia el esquema de BD, solo se edita este archivo.
 *  - Testabilidad: se puede reemplazar este repositorio por un mock en tests unitarios
 *    sin tocar EventService ni EventController.
 *  - Claridad: EventService contiene "qué hacer", EventRepository contiene "cómo acceder a los datos".
 *
 * Conexiones:
 *  - config/db.js → pool de conexiones PostgreSQL
 *  - Usado por services/event.service.js para operaciones de lectura sin transacción
 */

'use strict';
const pool = require('../config/db');

class EventRepository {

  /**
   * Devuelve los eventos de un usuario con paginación, ordenados por fecha de inicio.
   *
   * @param {number} userId   - ID del usuario dueño de los eventos
   * @param {object} options  - Parámetros de paginación
   * @param {number} [options.page=1]   - Página actual (comienza en 1)
   * @param {number} [options.limit=20] - Número de eventos por página
   * @returns {Promise<{ events: object[], total: number }>}
   */
  static async findByUserId(userId, { page = 1, limit = 20 } = {}) {
    // Calcula cuántos registros saltarse: página 1 → offset 0, página 2 → offset 20, etc.
    const offset = (page - 1) * limit;
    const { rows: events } = await pool.query(
      'SELECT * FROM events WHERE user_id = $1 ORDER BY start_time ASC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    // Segunda consulta para obtener el total sin el límite, necesario para calcular totalPages
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) FROM events WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countRows[0].count);
    return { events, total };
  }

  /**
   * Busca eventos que se solapen con un rango horario dado.
   *
   * La condición `NOT (end_time <= startTime OR start_time >= endTime)` es la forma
   * negada del algoritmo de solapamiento y es equivalente a `start_time < endTime AND end_time > startTime`.
   * Es decir: descarta los eventos que terminan antes de que empiece el nuevo evento,
   * o que empiezan después de que termine; lo que queda son los que se solapan.
   *
   * @param {number} userId     - ID del usuario para buscar solo sus eventos
   * @param {string} startTime  - Inicio del rango a verificar
   * @param {string} endTime    - Fin del rango a verificar
   * @param {number|null} [excludeId=null] - ID de evento a excluir (para updates)
   * @returns {Promise<object[]>} Lista de eventos en conflicto
   */
  static async findConflicts(userId, startTime, endTime, excludeId = null) {
    let query, params;
    if (excludeId) {
      // Al actualizar un evento, se excluye el propio evento para que no "conflicte" consigo mismo
      query = `SELECT * FROM events WHERE user_id = $1 AND id != $2
               AND NOT (end_time <= $3 OR start_time >= $4)
               FOR UPDATE`;
      params = [userId, excludeId, startTime, endTime];
    } else {
      // Para creación: busca conflictos entre todos los eventos del usuario
      query = `SELECT * FROM events WHERE user_id = $1
               AND NOT (end_time <= $2 OR start_time >= $3)
               FOR UPDATE`;
      params = [userId, startTime, endTime];
    }
    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Inserta un nuevo evento en la base de datos.
   *
   * @param {object} data           - Datos del evento
   * @param {number} data.user_id   - ID del usuario dueño
   * @param {string} data.title     - Título
   * @param {string} data.description - Descripción
   * @param {string} data.start_time  - Fecha/hora de inicio
   * @param {string} data.end_time    - Fecha/hora de fin
   * @param {string} data.location  - Ubicación del evento
   * @param {string} data.color     - Color para el calendario
   * @returns {Promise<object>} El evento creado con todos sus campos
   */
  static async create({ user_id, title, description, start_time, end_time, location, color }) {
    const { rows } = await pool.query(
      `INSERT INTO events (user_id, title, description, start_time, end_time, location, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, title, description, start_time, end_time, location, color]
    );
    return rows[0];
  }

  /**
   * Actualiza los datos de un evento existente.
   *
   * @param {number} id     - ID del evento a actualizar
   * @param {object} data   - Campos a actualizar
   * @param {string} data.title
   * @param {string} data.description
   * @param {string} data.start_time
   * @param {string} data.end_time
   * @param {string} data.location
   * @param {string} data.color
   * @returns {Promise<object|undefined>} El evento actualizado, o undefined si no existe
   */
  static async update(id, { title, description, start_time, end_time, location, color }) {
    const { rows } = await pool.query(
      `UPDATE events SET title=$1, description=$2, start_time=$3, end_time=$4,
       location=$5, color=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
      [title, description, start_time, end_time, location, color, id]
    );
    return rows[0];
  }

  /**
   * Elimina un evento por su ID.
   *
   * @param {number} id - ID del evento a eliminar
   * @returns {Promise<void>}
   */
  static async delete(id) {
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
  }

  /**
   * Busca un evento por su ID.
   *
   * @param {number} id - ID del evento a buscar
   * @returns {Promise<object|null>} El evento encontrado, o null si no existe
   */
  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    return rows[0] || null;
  }
}

module.exports = EventRepository;
