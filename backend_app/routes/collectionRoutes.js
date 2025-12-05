const express = require('express');
const { addPlant, getPlants, updatePlant, deletePlant, upload } = require('../controllers/collectionController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, upload.single('image'), addPlant);
router.get('/', authMiddleware, getPlants);
router.put('/:id', authMiddleware, updatePlant);
router.delete('/:id', authMiddleware, deletePlant);

module.exports = router;
