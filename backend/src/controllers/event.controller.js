const EventService = require('../services/event.service');

class EventController {
  static async create(req, res) {
    try {
      const { userId, title, description, startTime, endTime, timezone } = req.body;
      const newEvent = await EventService.createEvent(userId, {
        title,
        description,
        startTime,
        endTime,
        timezone
      });
      return res.status(201).json({ message: 'Evento creado con éxito', event: newEvent });
    } catch (error) {
      if (error.message.includes('Conflicto de horario')) {
        return res.status(409).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getByUser(req, res) {
    try {
      const { userId } = req.params;
      const events = await EventService.getEventsByUser(userId);
      return res.json(events);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al obtener los eventos' });
    }
  }
}

module.exports = EventController;