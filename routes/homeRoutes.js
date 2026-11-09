const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/', homeController.getIndex);
router.get('/api/artwork/:id', homeController.getArtworkDetails);

module.exports = router;
