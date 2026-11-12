'use strict';
const pool = require('../config/db');

class EventRepository {
  static async findByUserId(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { rows: events } = await pool.query(
      'SELECT * FROM events WHERE user_id = $1 ORDER BY start_time ASC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) FROM events WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countRows[0].count);
    return { events, total };
  }

  static async findConflicts(userId, startTime, endTime, excludeId = null) {
    let query, params;
    if (excludeId) {
      query = `SELECT * FROM events WHERE user_id = $1 AND id != $2
               AND NOT (end_time <= $3 OR start_time >= $4)
               FOR UPDATE`;
      params = [userId, excludeId, startTime, endTime];
    } else {
      query = `SELECT * FROM events WHERE user_id = $1
               AND NOT (end_time <= $2 OR start_time >= $3)
               FOR UPDATE`;
      params = [userId, startTime, endTime];
    }
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async create({ user_id, title, description, start_time, end_time, location, color }) {
    const { rows } = await pool.query(
      `INSERT INTO events (user_id, title, description, start_time, end_time, location, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, title, description, start_time, end_time, location, color]
    );
    return rows[0];
  }

  static async update(id, { title, description, start_time, end_time, location, color }) {
    const { rows } = await pool.query(
      `UPDATE events SET title=$1, description=$2, start_time=$3, end_time=$4,
       location=$5, color=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
      [title, description, start_time, end_time, location, color, id]
    );
    return rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
  }

  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    return rows[0] || null;
  }
}

module.exports = EventRepository;
