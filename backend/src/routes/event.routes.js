const { Router } = require('express');
const EventController = require('../controllers/event.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

router.post('/', verifyToken, EventController.create);
router.get('/user/:userId', verifyToken, EventController.getByUser);
router.put('/:id', verifyToken, EventController.update);
router.delete('/:id', verifyToken, EventController.remove);

module.exports = router;
