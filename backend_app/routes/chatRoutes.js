const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
const PYTHON_RAG_URL = process.env.PYTHON_RAG_URL || 'http://localhost:8000';

// Create new conversation
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    const result = await pool.query(
      'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *',
      [userId, title || 'New Conversation']
    );

    res.json({ conversation: result.rows[0] });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get all conversations for user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify conversation belongs to user
    const convCheck = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message in conversation
router.post('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    // Verify conversation belongs to user
    const convCheck = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get recent messages for context
    const historyResult = await pool.query(
      'SELECT message, response FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 5',
      [conversationId]
    );

    const history = historyResult.rows.reverse().map(row => ({
      user: row.message,
      assistant: row.response
    }));

    // Call Python RAG service
    const ragResponse = await fetch(`${PYTHON_RAG_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, k: 5, history }),
    });

    if (!ragResponse.ok) {
      throw new Error(`RAG service error: ${ragResponse.status}`);
    }

    const ragData = await ragResponse.json();

    // Save message to database
    const messageResult = await pool.query(
      'INSERT INTO messages (conversation_id, message, response, sources) VALUES ($1, $2, $3, $4) RETURNING *',
      [conversationId, message, ragData.answer, JSON.stringify(ragData.sources)]
    );

    // Update conversation's updated_at and generate title from first message
    if (historyResult.rows.length === 0) {
      // First message - use it as title (truncated)
      const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      await pool.query(
        'UPDATE conversations SET title = $1, updated_at = NOW() WHERE id = $2',
        [title, conversationId]
      );
    } else {
      await pool.query(
        'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
        [conversationId]
      );
    }

    res.json({
      message: ragData.answer,
      sources: ragData.sources,
      messageId: messageResult.rows[0].id
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Delete conversation
router.delete('/conversations/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING *',
      [conversationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Legacy endpoint (for backwards compatibility)
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message, history } = req.body;
    const userId = req.user.id;

    console.log('Forwarding to Python RAG:', message);

    // Call Python FastAPI service
    const ragResponse = await fetch(`${PYTHON_RAG_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        k: 5,
        history: history || []
      }),
    });

    if (!ragResponse.ok) {
      throw new Error(`RAG service error: ${ragResponse.status}`);
    }

    const ragData = await ragResponse.json();

    // Save to chat history with sources
    await pool.query(
      'INSERT INTO chat_history (user_id, message, response, sources) VALUES ($1, $2, $3, $4)',
      [userId, message, ragData.answer, JSON.stringify(ragData.sources)]
    );

    res.json({
      message: ragData.answer,
      sources: ragData.sources
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get response', details: error.message });
  }
});

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, message, response, sources, created_at FROM chat_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json({ history: result.rows });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

module.exports = router;