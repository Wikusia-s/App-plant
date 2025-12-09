const express = require('express');
const { recommendSimilar, recommendConstraints, recommendHybrid } = require('../controllers/recommendationController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/similar', authMiddleware, recommendSimilar);
router.post('/constraints', authMiddleware, recommendConstraints);
router.post('/hybrid', authMiddleware, recommendHybrid);

module.exports = router;
