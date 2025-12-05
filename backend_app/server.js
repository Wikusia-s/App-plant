const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const { createTables } = require('./config/initDb');
const { startPythonRAG, initializeEmbeddings } = require('./controllers/ragController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Twój frontend
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/collection', collectionRoutes);

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));



// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Plant Chatbot Backend...\n');

    // 1. Initialize database tables
    console.log('📊 Setting up database...');
    await createTables();

    // 2. Start Python RAG service
    console.log('🐍 Starting Python RAG service...');
    await startPythonRAG();

    // 3. Start Express server first
    app.listen(PORT, () => {
      console.log(`\n✅ Backend ready!`);
      console.log(`📍 Node.js API: http://localhost:${PORT}`);
      console.log(`🐍 Python RAG: http://localhost:8000`);
      console.log(`🌐 Frontend: http://localhost:5173\n`);
    });

    // 4. Initialize embeddings AFTER server is running (with retry logic)
    console.log('🧠 Checking embeddings...');
    // Wait a bit longer before initializing
    setTimeout(() => initializeEmbeddings(), 5000);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down gracefully...');
  process.exit(0);
});

startServer();


