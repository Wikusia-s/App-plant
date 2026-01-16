const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { listTasks, createTask, updateTask, deleteTask } = require('../controllers/careController');

// Protect all care task routes
router.use(authMiddleware);

// GET /api/care
router.get('/', listTasks);

// POST /api/care
router.post('/', createTask);

// PATCH /api/care/:id
router.patch('/:id', updateTask);

// DELETE /api/care/:id
router.delete('/:id', deleteTask);

module.exports = router;
