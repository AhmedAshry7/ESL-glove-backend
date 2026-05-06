const express = require('express');
const router = express.Router();
const roomsController = require('../controllers/roomsController');

router.post('/create', roomsController.startRoom);
router.post('/close', roomsController.endRoom);
router.get('/:roomId', roomsController.getRoomInfo);

module.exports = router;