/**
 * @file controllers/user.controller.js
 * @description Controlador de gestión de usuarios.
 *
 * Expone los métodos que manejan las peticiones HTTP relacionadas con usuarios.
 * Delega todas las consultas a la base de datos en UserModel.
 *
 * Conexiones:
 *  - models/user.model.js → operaciones CRUD sobre la tabla users
 *  - middleware/auth.middleware.js → todas las rutas de este controlador requieren verifyToken,
 *    por lo que req.user siempre contiene { id, email } del usuario autenticado
 *  - routes/user.routes.js → registra las rutas que llaman a estos métodos
 */

const UserModel = require('../models/user.model');

const UserController = {

  /**
   * Devuelve el perfil del usuario autenticado.
   *
   * Usa req.user.id (inyectado por verifyToken) en lugar de un parámetro de URL,
   * por lo que solo puede devolver los datos del usuario dueño del token.
   *
   * @param {import('express').Request}  req - req.user.id contiene el ID del usuario autenticado
   * @param {import('express').Response} res
   */
  async getProfile(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, created_at: user.created_at } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Actualiza el perfil del usuario autenticado (nombre, email y opcionalmente contraseña).
   *
   * @param {import('express').Request}  req - req.body: { name, email, password? }
   * @param {import('express').Response} res
   */
  async updateProfile(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, message: 'name y email son requeridos' });
      }
      // La contraseña es opcional al actualizar el perfil, pero si se proporciona
      // debe tener al menos 6 caracteres para garantizar una seguridad mínima
      if (password && password.length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
      }
      const user = await UserModel.updateWithPassword(req.user.id, { name, email, password });
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, created_at: user.created_at } });
    } catch (err) {
      // Código de error 23505 de PostgreSQL: violación de constraint UNIQUE.
      // Ocurre cuando se intenta guardar un email que ya pertenece a otro usuario.
      if (err.code === '23505') {
        return res.status(409).json({ success: false, message: 'El email ya está registrado por otro usuario' });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Devuelve la lista de todos los usuarios registrados.
   *
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   */
  async getAll(req, res) {
    try {
      const users = await UserModel.findAll();
      res.json({ success: true, data: users });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Devuelve un usuario específico por su ID.
   *
   * @param {import('express').Request}  req - req.params.id: ID del usuario a buscar
   * @param {import('express').Response} res
   */
  async getById(req, res) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      res.json({ success: true, data: user });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Crea un nuevo usuario (ruta administrativa protegida por token).
   *
   * @param {import('express').Request}  req - req.body: { name, email, password }
   * @param {import('express').Response} res
   */
  async create(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'name, email y password son requeridos' });
      }

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'El email ya está registrado' });
      }

      // UserModel.create hashea la contraseña internamente; nunca se guarda en texto plano
      const user = await UserModel.create({ name, email, password });
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      // Código 23505: violación de UNIQUE en email (doble petición simultánea puede pasarlo)
      if (err.code === '23505') {
        return res.status(409).json({ success: false, message: 'El email ya está registrado' });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Actualiza nombre y email de un usuario por su ID.
   *
   * Incluye verificación de ownership: solo el propio usuario puede modificar sus datos.
   * Aunque el token sea válido, un usuario no puede editar el perfil de otro usuario.
   *
   * @param {import('express').Request}  req - req.params.id: ID a actualizar; req.body: { name, email }
   * @param {import('express').Response} res
   */
  async update(req, res) {
    try {
      // Ownership check: compara el ID del parámetro de ruta con el ID del token.
      // Convierte req.params.id a número porque los parámetros de URL son siempre strings.
      if (parseInt(req.params.id, 10) !== req.user.id) {
        return res.status(403).json({ success: false, message: 'No autorizado para modificar este usuario' });
      }

      const { name, email } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, message: 'name y email son requeridos' });
      }

      const user = await UserModel.update(req.params.id, { name, email });
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      res.json({ success: true, data: user });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Elimina un usuario por su ID.
   *
   * Incluye verificación de ownership: solo el propio usuario puede eliminar su cuenta.
   * Tener un token válido no es suficiente para borrar la cuenta de otro usuario.
   *
   * @param {import('express').Request}  req - req.params.id: ID del usuario a eliminar
   * @param {import('express').Response} res
   */
  async remove(req, res) {
    try {
      // Ownership check: un usuario solo puede eliminar su propia cuenta
      if (parseInt(req.params.id, 10) !== req.user.id) {
        return res.status(403).json({ success: false, message: 'No autorizado para eliminar este usuario' });
      }
      const user = await UserModel.delete(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = UserController;
