/**
 * @file services/event.service.js
 * @description Servicio de lógica de negocio para la gestión de eventos.
 *
 * Este es el archivo más importante de la capa de negocio. Contiene:
 *  - La detección de conflictos de horario entre eventos del mismo usuario.
 *  - Transacciones ACID para garantizar la integridad de los datos bajo concurrencia.
 *  - La lógica de ownership (verificación de que el usuario sea dueño del evento).
 *
 * No hace acceso directo a la base de datos en todos los métodos; algunos usan
 * EventRepository (para operaciones simples) y otros usan el pool directamente
 * (cuando necesitan transacciones con múltiples queries).
 *
 * Conexiones:
 *  - config/db.js → pool de conexiones para transacciones ACID
 *  - repositories/event.repository.js → queries de lectura sin transacción
 *  - Llamado por controllers/event.controller.js
 */

const pool = require('../config/db');
const EventRepository = require('../repositories/event.repository');

class EventService {

  /**
   * Crea un nuevo evento verificando que no haya conflictos de horario.
   *
   * Algoritmo de detección de solapamientos:
   *   Dos eventos se solapan si: StartA < EndB AND EndA > StartB
   *
   *   Ejemplo:
   *     Evento A: 10:00 → 12:00
   *     Evento B: 11:00 → 13:00
   *     ¿Hay conflicto? StartA(10:00) < EndB(13:00) → SÍ, y EndA(12:00) > StartB(11:00) → SÍ
   *     Por lo tanto hay conflicto: se solapan entre las 11:00 y las 12:00.
   *
   *   Contraejemplo (sin conflicto):
   *     Evento A: 10:00 → 11:00
   *     Evento B: 11:00 → 12:00
   *     ¿Hay conflicto? StartA(10:00) < EndB(12:00) → SÍ, pero EndA(11:00) > StartB(11:00) → NO
   *     Por lo tanto NO hay conflicto: eventos contiguos no se solapan.
   *
   * Usa una transacción ACID con FOR UPDATE para evitar condiciones de carrera:
   * si dos peticiones llegan al mismo tiempo, solo una puede adquirir el lock,
   * la segunda espera y luego detecta correctamente el conflicto.
   *
   * @param {number} userId    - ID del usuario dueño del evento
   * @param {object} eventData - Datos del evento a crear
   * @param {string} eventData.title       - Título del evento
   * @param {string} eventData.description - Descripción del evento
   * @param {string} eventData.startTime   - Fecha/hora de inicio en formato ISO 8601
   * @param {string} eventData.endTime     - Fecha/hora de fin en formato ISO 8601
   * @param {string} eventData.timezone    - Zona horaria del evento (ej: 'America/Bogota')
   * @returns {Promise<object>} El evento creado con todos sus campos
   * @throws {Error} Si hay conflicto de horario con un evento existente
   */
  static async createEvent(userId, eventData) {
    const { title, description, startTime, endTime, timezone } = eventData;

    // Se obtiene una conexión dedicada del pool para manejar la transacción.
    // Es importante llamar a client.release() en el bloque finally para devolver
    // la conexión al pool y evitar agotarlo.
    const client = await pool.connect();

    try {
      // BEGIN inicia una transacción ACID:
      // - Atomicidad: o se crean el evento y el registro, o no ocurre nada
      // - Consistencia: la BD siempre queda en un estado válido
      // - Aislamiento: otras transacciones no ven los cambios hasta el COMMIT
      // - Durabilidad: una vez confirmada, la operación sobrevive a reinicios
      await client.query('BEGIN');

      // FOR UPDATE bloquea las filas que coincidan con el filtro de solapamiento.
      // Si otra transacción simultánea ya bloqueó esas filas, esta espera.
      // Esto serializa el acceso y evita que dos peticiones simultáneas pasen
      // la verificación de conflicto al mismo tiempo y creen eventos solapados.
      const overlapQuery = `
        SELECT id, title, start_time, end_time FROM events 
        WHERE user_id = $1 
          AND start_time < $3 
          AND end_time > $2
        FOR UPDATE;
      `;
      // $2 = startTime del nuevo evento, $3 = endTime del nuevo evento
      const conflictCheck = await client.query(overlapQuery, [userId, startTime, endTime]);

      if (conflictCheck.rows.length > 0) {
        const c = conflictCheck.rows[0];
        throw new Error(`Conflicto de horario: Se solapa con "${c.title}" (${c.start_time} - ${c.end_time})`);
      }

      const insertQuery = `
        INSERT INTO events (user_id, title, description, start_time, end_time, timezone)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const { rows } = await client.query(insertQuery, [
        userId,
        title,
        description,
        startTime,
        endTime,
        timezone
      ]);

      // COMMIT confirma la transacción; los cambios son permanentes y visibles
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      // ROLLBACK deshace todos los cambios de la transacción si algo falló,
      // dejando la BD exactamente como estaba antes del BEGIN
      await client.query('ROLLBACK');
      throw err;
    } finally {
      // Siempre se libera la conexión, haya éxito o error
      client.release();
    }
  }

  /**
   * Devuelve los eventos paginados de un usuario.
   *
   * @param {number} userId   - ID del usuario dueño de los eventos
   * @param {object} options  - Opciones de paginación
   * @param {number} [options.page=1]   - Número de página (empieza en 1)
   * @param {number} [options.limit=20] - Eventos por página
   * @returns {Promise<{ events: object[], total: number, page: number, limit: number, totalPages: number }>}
   */
  static async getEventsByUser(userId, { page = 1, limit = 20 } = {}) {
    const { events, total } = await EventRepository.findByUserId(userId, { page, limit });
    return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Actualiza un evento verificando ownership y ausencia de conflictos.
   *
   * Usa una transacción con FOR UPDATE para:
   *  1. Verificar que el evento exista y pertenezca al usuario (serializa el acceso).
   *  2. Comprobar que el nuevo horario no choque con otros eventos, excluyendo el propio.
   *
   * @param {number|string} eventId  - ID del evento a actualizar
   * @param {number} userId          - ID del usuario autenticado (ownership check)
   * @param {object} eventData       - Nuevos datos del evento
   * @returns {Promise<object>} El evento actualizado
   * @throws {Error} Si el evento no existe, no pertenece al usuario, o hay conflicto de horario
   */
  static async updateEvent(eventId, userId, eventData) {
    const { title, description, startTime, endTime, timezone } = eventData;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // FOR UPDATE en la verificación de ownership serializa el acceso:
      // si otra operación está modificando este evento, esta transacción espera
      const ownerCheck = await client.query(
        'SELECT id FROM events WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [eventId, userId]
      );
      if (ownerCheck.rows.length === 0) {
        throw new Error('Evento no encontrado o no autorizado');
      }

      // Verifica conflictos excluyendo el evento que se está actualizando (id != $2),
      // para que el evento no "choque" consigo mismo al cambiar solo su descripción
      const overlapCheck = await client.query(
        `SELECT id, title, start_time, end_time FROM events
         WHERE user_id = $1 AND id != $2
           AND start_time < $4 AND end_time > $3
         FOR UPDATE`,
        [userId, eventId, startTime, endTime]
      );
      if (overlapCheck.rows.length > 0) {
        const c = overlapCheck.rows[0];
        throw new Error(`Conflicto de horario: Se solapa con "${c.title}" (${c.start_time} - ${c.end_time})`);
      }

      const { rows } = await client.query(
        `UPDATE events
         SET title = $1, description = $2, start_time = $3, end_time = $4, timezone = $5
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [title, description, startTime, endTime, timezone, eventId, userId]
      );

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Devuelve estadísticas de eventos del usuario.
   *
   * @param {number} userId - ID del usuario autenticado
   * @returns {Promise<{ total: number, upcoming: number, active: number }>}
   *   - total:    todos los eventos del usuario
   *   - upcoming: eventos cuyo inicio es en el futuro
   *   - active:   eventos que están ocurriendo ahora mismo
   */
  static async getStats(userId) {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) AS total,
        -- FILTER (WHERE ...) es una extensión de PostgreSQL que cuenta solo las filas
        -- que cumplen la condición, sin necesidad de subconsultas o CASE WHEN
        COUNT(*) FILTER (WHERE start_time > NOW()) AS upcoming,
        COUNT(*) FILTER (WHERE start_time <= NOW() AND end_time >= NOW()) AS active
       FROM events WHERE user_id = $1`,
      [userId]
    );
    const row = rows[0];
    return {
      total: parseInt(row.total, 10),
      upcoming: parseInt(row.upcoming, 10),
      active: parseInt(row.active, 10)
    };
  }

  /**
   * Elimina un evento verificando que pertenezca al usuario autenticado.
   *
   * Usa transacción con FOR UPDATE para evitar eliminaciones concurrentes
   * del mismo evento (dos peticiones delete simultáneas del mismo cliente).
   *
   * @param {number|string} eventId - ID del evento a eliminar
   * @param {number} userId         - ID del usuario autenticado (ownership check)
   * @returns {Promise<{ deleted: boolean }>}
   * @throws {Error} Si el evento no existe o no pertenece al usuario
   */
  static async deleteEvent(eventId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // El lock FOR UPDATE previene condiciones de carrera donde dos peticiones
      // simultáneas de delete pasen la verificación de ownership al mismo tiempo
      const ownerCheck = await client.query(
        'SELECT id FROM events WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [eventId, userId]
      );
      if (ownerCheck.rows.length === 0) {
        throw new Error('Evento no encontrado o no autorizado');
      }

      await client.query(
        'DELETE FROM events WHERE id = $1 AND user_id = $2',
        [eventId, userId]
      );

      await client.query('COMMIT');
      return { deleted: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = EventService;
