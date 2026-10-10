const { Router } = require('express');
const EventController = require('../controllers/event.controller');

const router = Router();

router.post('/', EventController.create);
router.get('/user/:userId', EventController.getByUser);

module.exports = router;