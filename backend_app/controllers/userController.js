const pool = require('../config/database');

const updateUser = async (req, res) => {
    const userId = req.user.id; // id z JWT
    const { username, email } = req.body;

    try {
        // Aktualizacja użytkownika
        const result = await pool.query(
            'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email',
            [username, email, userId]
        );

        res.json({
            message: "User updated successfully",
            user: result.rows[0]
        });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ error: "Server error updating user" });
    }
};

module.exports = { updateUser };
