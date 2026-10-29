const pool = require('../config/db');

class EventService {
  static async createEvent(userId, eventData) {
    const { title, description, startTime, endTime, timezone } = eventData;
    const client = await pool.connect();

    try {
      // Transacción ACID con bloqueo para evitar condiciones de carrera simultáneas
      await client.query('BEGIN');

      // Motor matemático de solapamientos: StartA < EndB AND EndA > StartB
      const overlapQuery = `
        SELECT id FROM events 
        WHERE user_id = $1 
          AND start_time < $3 
          AND end_time > $2
        FOR UPDATE;
      `;
      const conflictCheck = await client.query(overlapQuery, [userId, startTime, endTime]);

      if (conflictCheck.rows.length > 0) {
        throw new Error('Conflicto de horario: El intervalo se solapa con otro evento existente.');
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

  static async getEventsByUser(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM events WHERE user_id = $1 ORDER BY start_time ASC',
      [userId]
    );
    return rows;
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
        `SELECT id FROM events
         WHERE user_id = $1 AND id != $2
           AND start_time < $4 AND end_time > $3
         FOR UPDATE`,
        [userId, eventId, startTime, endTime]
      );
      if (overlapCheck.rows.length > 0) {
        throw new Error('Conflicto de horario: El intervalo se solapa con otro evento existente.');
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

  static async deleteEvent(eventId, userId) {
    const { rows } = await pool.query(
      'DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING id',
      [eventId, userId]
    );
    if (rows.length === 0) {
      throw new Error('Evento no encontrado o no autorizado');
    }
    return { deleted: true };
  }
}

module.exports = EventService;