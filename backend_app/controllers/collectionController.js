const pool = require('../config/database');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Dodawanie rośliny
const addPlant = async (req, res) => {
    const userId = req.user.id;
    const { name, species } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !imageUrl || !species) {
        return res.status(400).json({ error: 'Missing name, image, or species' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO plants (user_id, name, image_url, species) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, name, imageUrl, species]
        );

        res.status(201).json({ plant: result.rows[0] });
    } catch (err) {
        console.error('Add plant error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};


// Pobieranie wszystkich roślin użytkownika
const getPlants = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            'SELECT * FROM plants WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        res.json({ plants: result.rows });
    } catch (err) {
        console.error('Get plants error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Aktualizacja rośliny
const updatePlant = async (req, res) => {
    const userId = req.user.id;
    const plantId = req.params.id;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Missing name' });
    }

    try {
        const result = await pool.query(
            'UPDATE plants SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [name, plantId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plant not found' });
        }

        res.json({ plant: result.rows[0] });
    } catch (err) {
        console.error('Update plant error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Usuwanie rośliny
const deletePlant = async (req, res) => {
    const userId = req.user.id;
    const plantId = req.params.id;

    try {
        const result = await pool.query(
            'DELETE FROM plants WHERE id = $1 AND user_id = $2 RETURNING *',
            [plantId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plant not found' });
        }

        res.json({ message: 'Plant deleted', plant: result.rows[0] });
    } catch (err) {
        console.error('Delete plant error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

module.exports = { addPlant, getPlants, updatePlant, deletePlant, upload };
