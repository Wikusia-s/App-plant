const express = require('express');
const router = express.Router();
const { updateUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.put('/update', authMiddleware, updateUser);

module.exports = router;
