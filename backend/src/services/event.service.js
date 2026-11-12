const pool = require('../config/db');
const EventRepository = require('../repositories/event.repository');

class EventService {
  static async createEvent(userId, eventData) {
    const { title, description, startTime, endTime, timezone } = eventData;
    const client = await pool.connect();

    try {
      // Transacción ACID con bloqueo para evitar condiciones de carrera simultáneas
      await client.query('BEGIN');

      // Motor matemático de solapamientos: StartA < EndB AND EndA > StartB
      const overlapQuery = `
        SELECT id, title, start_time, end_time FROM events 
        WHERE user_id = $1 
          AND start_time < $3 
          AND end_time > $2
        FOR UPDATE;
      `;
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

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async getEventsByUser(userId, { page = 1, limit = 20 } = {}) {
    const { events, total } = await EventRepository.findByUserId(userId, { page, limit });
    return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateEvent(eventId, userId, eventData) {
    const { title, description, startTime, endTime, timezone } = eventData;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify ownership with lock
      const ownerCheck = await client.query(
        'SELECT id FROM events WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [eventId, userId]
      );
      if (ownerCheck.rows.length === 0) {
        throw new Error('Evento no encontrado o no autorizado');
      }

      // Check overlaps excluding the event being updated
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

  static async getStats(userId) {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) AS total,
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

  static async deleteEvent(eventId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the row to prevent concurrent deletes racing
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
