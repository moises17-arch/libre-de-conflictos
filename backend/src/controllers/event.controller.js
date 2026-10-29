const EventService = require('../services/event.service');

class EventController {
  static async create(req, res) {
    try {
      const userId = req.user.id;
      const { title, description, startTime, endTime, timezone } = req.body;
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

  static async update(req, res) {
    try {
      const { title, description, startTime, endTime, timezone } = req.body;
      const updatedEvent = await EventService.updateEvent(req.params.id, req.user.id, {
        title, description, startTime, endTime, timezone
      });
      return res.json({ message: 'Evento actualizado con éxito', event: updatedEvent });
    } catch (error) {
      if (error.message.includes('Conflicto')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async remove(req, res) {
    try {
      await EventService.deleteEvent(req.params.id, req.user.id);
      return res.json({ message: 'Evento eliminado con éxito' });
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = EventController;