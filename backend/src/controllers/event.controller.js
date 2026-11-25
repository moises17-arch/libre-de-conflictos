/**
 * @file controllers/event.controller.js
 * @description Controlador de gestión de eventos del calendario.
 *
 * Este controlador actúa como intermediario entre las rutas HTTP y la lógica de negocio.
 * Delega toda la lógica (detección de conflictos, transacciones) a EventService.
 *
 * Principio de seguridad clave:
 *  El `userId` SIEMPRE se toma de `req.user.id` (inyectado por el middleware JWT),
 *  nunca de `req.body` ni de `req.params` directamente para operaciones de escritura.
 *  Esto evita que un usuario autenticado pueda crear o modificar eventos en nombre
 *  de otro usuario simplemente poniendo un ID diferente en el cuerpo de la petición.
 *
 * Conexiones:
 *  - services/event.service.js → contiene toda la lógica de negocio y detección de conflictos
 *  - middleware/auth.middleware.js → todas las rutas requieren verifyToken
 *  - routes/event.routes.js → registra las rutas que invocan estos métodos
 */

const EventService = require('../services/event.service');

class EventController {

  /**
   * Crea un nuevo evento para el usuario autenticado.
   *
   * Llama a EventService.createEvent con el userId del token (nunca del body).
   * Si EventService detecta un conflicto de horario, responde con 409 Conflict.
   *
   * @param {import('express').Request}  req - req.body: { title, description, startTime, endTime, timezone }
   * @param {import('express').Response} res
   */
  static async create(req, res) {
    try {
      // userId viene del token JWT verificado, no del cuerpo de la petición
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
      // HTTP 409 Conflict: el nuevo evento se solapa con uno ya existente del usuario.
      // EventService lanza este error con el mensaje "Conflicto de horario: ..."
      if (error.message.includes('Conflicto de horario')) {
        return res.status(409).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Devuelve los eventos paginados de un usuario específico.
   *
   * Verifica que el userId del parámetro de ruta coincida con el del token,
   * para que un usuario no pueda ver los eventos privados de otro usuario.
   *
   * @param {import('express').Request}  req - req.params.userId, req.query.page, req.query.limit
   * @param {import('express').Response} res
   */
  static async getByUser(req, res) {
    try {
      const { userId } = req.params;
      // Verificación de autorización: el usuario solo puede consultar sus propios eventos.
      // Convierte userId a número porque los parámetros de URL son strings.
      if (parseInt(userId, 10) !== req.user.id) {
        return res.status(403).json({ error: 'No autorizado para ver eventos de otro usuario' });
      }
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const { events, total, totalPages } = await EventService.getEventsByUser(userId, { page, limit });
      return res.json({ events, total, page, limit, totalPages });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al obtener los eventos' });
    }
  }

  /**
   * Actualiza un evento existente del usuario autenticado.
   *
   * EventService verifica internamente que el evento pertenezca al usuario
   * y que el nuevo horario no genere conflictos con otros eventos.
   *
   * @param {import('express').Request}  req - req.params.id: ID del evento; req.body: datos actualizados
   * @param {import('express').Response} res
   */
  static async update(req, res) {
    try {
      const { title, description, startTime, endTime, timezone } = req.body;
      const updatedEvent = await EventService.updateEvent(req.params.id, req.user.id, {
        title, description, startTime, endTime, timezone
      });
      return res.json({ message: 'Evento actualizado con éxito', event: updatedEvent });
    } catch (error) {
      // HTTP 409: el horario actualizado choca con otro evento existente del usuario
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

  /**
   * Elimina un evento del usuario autenticado.
   *
   * EventService verifica que el evento pertenezca al usuario antes de borrarlo.
   *
   * @param {import('express').Request}  req - req.params.id: ID del evento a eliminar
   * @param {import('express').Response} res
   */
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

  /**
   * Devuelve estadísticas de los eventos del usuario autenticado.
   *
   * Retorna conteos de: total de eventos, próximos y activos en este momento.
   * Pasa el error al handler global mediante `next(error)` para un manejo centralizado.
   *
   * @param {import('express').Request}  req - req.user.id: ID del usuario autenticado
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  static async getStats(req, res, next) {
    try {
      const stats = await EventService.getStats(req.user.id);
      return res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EventController;
