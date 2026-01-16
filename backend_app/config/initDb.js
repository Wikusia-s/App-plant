const { Pool } = require('pg');
require('dotenv').config();

const createTables = async () => {
  // First connect to default postgres database
  const defaultPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5433,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'plant_app_db';
    await defaultPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`✓ Database ${dbName} created`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✓ Database already exists');
    } else {
      console.error('Error creating database:', error.message);
    }
  } finally {
    await defaultPool.end();
  }

  // Now connect to the actual database
  const pool = require('./database');

  try {
    await pool.query(`
      -- Enable pgvector extension
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Conversations table
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Messages in conversations
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        sources JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Old chat_history table (keep for backwards compatibility or migrate)
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        sources JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS plant_documents (
        id SERIAL PRIMARY KEY,
        plant_name VARCHAR(255) NOT NULL,
        article_title VARCHAR(500) NOT NULL,
        article_url TEXT,
        chunk_text TEXT NOT NULL,
        embedding vector(384),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- User plant collection table (for images of plants)
      CREATE TABLE IF NOT EXISTS plants (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,            -- nazwa nadana przez użytkownika
          image_url TEXT NOT NULL,               -- URL lub ścieżka do zdjęcia
          species VARCHAR(255),                  -- gatunek podawany przez użytkownika
          notes TEXT,  
          embedding vector(384),                      -- przyszły embedding do systemu rekomendacji
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

        -- Ensure new columns exist when upgrading
        ALTER TABLE plants ADD COLUMN IF NOT EXISTS species VARCHAR(255);
        ALTER TABLE plants ADD COLUMN IF NOT EXISTS notes TEXT;


      CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_plant_documents_plant_name ON plant_documents(plant_name);
      
      -- Create ivfflat index for efficient vector similarity search
      CREATE INDEX IF NOT EXISTS plant_documents_embedding_idx 
        ON plant_documents USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100);

      -- Care tasks for user schedules
      CREATE TABLE IF NOT EXISTS care_tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plant_id INTEGER REFERENCES plants(id) ON DELETE SET NULL,
        type VARCHAR(20) NOT NULL,
        title VARCHAR(255),
        due_at TIMESTAMP NOT NULL,
        notes TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_care_tasks_user_id ON care_tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_care_tasks_due_at ON care_tasks(due_at);
      CREATE INDEX IF NOT EXISTS idx_care_tasks_status ON care_tasks(status);

    `);

    // Analyze table for better query planning
    await pool.query('ANALYZE plant_documents;');

    console.log('✓ Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

module.exports = { createTables };

// Execute if run directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('✓ Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Database initialization failed:', error);
      process.exit(1);
    });
}
