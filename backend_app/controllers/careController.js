const pool = require('../config/database');

const allowedTypes = new Set(['water', 'fertilize', 'prune', 'repot', 'custom']);
const allowedStatuses = new Set(['pending', 'done']);

// List care tasks for the authenticated user
const listTasks = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(
            `SELECT ct.id, ct.user_id, ct.plant_id, ct.type, ct.title, ct.due_at, ct.notes, ct.status, ct.created_at,
              p.name AS plant_name
       FROM care_tasks ct
       LEFT JOIN plants p ON p.id = ct.plant_id
       WHERE ct.user_id = $1
       ORDER BY ct.due_at ASC`,
            [userId]
        );
        res.json({ tasks: result.rows });
    } catch (err) {
        console.error('List care tasks error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Create a new care task
const createTask = async (req, res) => {
    const userId = req.user.id;
    const { plant_id, type, title, due_at, notes } = req.body;

    if (!type || !allowedTypes.has(type)) {
        return res.status(400).json({ error: 'Invalid or missing type' });
    }
    if (!due_at) {
        return res.status(400).json({ error: 'Missing due_at' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO care_tasks (user_id, plant_id, type, title, due_at, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
            [userId, plant_id || null, type, title || null, due_at, notes || null]
        );
        res.status(201).json({ task: result.rows[0] });
    } catch (err) {
        console.error('Create care task error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Update an existing care task (partial update)
const updateTask = async (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { plant_id, type, title, due_at, notes, status } = req.body;

    const fields = [];
    const params = [taskId, userId]; // $1, $2 reserved for id, user_id

    const pushField = (column, value) => {
        params.push(value);
        fields.push(`${column} = $${params.length}`);
    };

    // Only allow specific fields
    if (plant_id !== undefined) { pushField('plant_id', plant_id || null); }
    if (type !== undefined) {
        if (!allowedTypes.has(type)) return res.status(400).json({ error: 'Invalid type' });
        pushField('type', type);
    }
    if (title !== undefined) { pushField('title', title || null); }
    if (due_at !== undefined) { pushField('due_at', due_at); }
    if (notes !== undefined) { pushField('notes', notes || null); }
    if (status !== undefined) {
        if (!allowedStatuses.has(status)) return res.status(400).json({ error: 'Invalid status' });
        pushField('status', status);
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    try {
        const query = `UPDATE care_tasks SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`;
        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ task: result.rows[0] });
    } catch (err) {
        console.error('Update care task error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Delete a care task
const deleteTask = async (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id;

    try {
        const result = await pool.query(
            'DELETE FROM care_tasks WHERE id = $1 AND user_id = $2 RETURNING *',
            [taskId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted', task: result.rows[0] });
    } catch (err) {
        console.error('Delete care task error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

module.exports = { listTasks, createTask, updateTask, deleteTask };
