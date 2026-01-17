const { spawn } = require('child_process');
const path = require('path');
const pool = require('../config/database');
const fs = require('fs');

// Cache for Python process
let pythonProcess = null;

// Start Python RAG service
const startPythonRAG = () => {
  return new Promise((resolve, reject) => {
    const backendDir = path.join(__dirname, '..');

    // Try multiple Python paths
    const possiblePythonPaths = [
      path.join(backendDir, '..', '.venv', 'Scripts', 'python.exe'),   // ← właściwy!
      path.join(backendDir, 'venv', 'Scripts', 'python.exe'),
      path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
      'python',
      'python3'
    ];

    let pythonCmd = 'python';
    for (const pythonPath of possiblePythonPaths) {
      if (pythonPath.includes('venv') && fs.existsSync(pythonPath)) {
        pythonCmd = pythonPath;
        break;
      }
    }

    console.log(`Using Python: ${pythonCmd}`);

    // Use cmd.exe on Windows to properly execute commands
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'cmd.exe' : pythonCmd;
    const args = isWindows
      ? ['/c', pythonCmd, '-m', 'uvicorn', 'app:app', '--port', '8000', '--host', '127.0.0.1']
      : ['-m', 'uvicorn', 'app:app', '--port', '8000', '--host', '127.0.0.1'];

    pythonProcess = spawn(command, args, {
      cwd: backendDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    let startupComplete = false;
    let outputBuffer = '';

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;
      console.log(`[Python RAG] ${output.trim()}`);

      if ((output.includes('Application startup complete') ||
        output.includes('Uvicorn running')) && !startupComplete) {
        startupComplete = true;
        console.log('✓ Python RAG service started on port 8000');
        resolve();
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const error = data.toString();
      // stderr is actually used for INFO logs by uvicorn
      console.log(`[Python RAG] ${error.trim()}`);

      if ((error.includes('Application startup complete') ||
        error.includes('Uvicorn running')) && !startupComplete) {
        startupComplete = true;
        console.log('✓ Python RAG service started on port 8000');
        resolve();
      }

      if (error.includes('No module named') || error.includes('ModuleNotFoundError')) {
        console.error('❌ Missing Python dependencies!');
      }
    });

    pythonProcess.on('error', (error) => {
      console.error(`Failed to start Python process: ${error.message}`);
      console.error('💡 Make sure Python is installed and uvicorn is available');
      reject(error);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python RAG process exited with code ${code}`);
      pythonProcess = null;
      if (code !== 0 && !startupComplete) {
        console.error('❌ Python RAG failed to start properly');
      }
    });

    // Extended timeout - only resolve if not already resolved
    setTimeout(() => {
      if (!startupComplete) {
        console.log('⚠️  Python RAG startup timeout, but will retry initialization...');
        resolve(); // Continue anyway
      }
    }, 20000); // 20 seconds timeout
  });
};

// Initialize embeddings from JSON file to database
const initializeEmbeddings = async () => {
  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM plant_documents');
    const count = parseInt(countResult.rows[0].count);

    if (count > 0) {
      console.log(`✓ Found ${count} existing embeddings in database`);
      return;
    }

    console.log('⏳ Initializing embeddings from plant_articles.json...');

    // Retry logic for initialization
    let attempts = 0;
    const maxAttempts = 5;
    const retryDelay = 3000; // 3 seconds between retries

    while (attempts < maxAttempts) {
      try {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));

        const response = await fetch('http://localhost:8000/api/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log(`✓ Initialized ${result.count} document chunks in database`);
        return; // Success!
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Retry ${attempts}/${maxAttempts} - Python service not ready yet...`);
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(`⚠️  Error initializing embeddings: ${error.message}`);
    console.log('💡 Manually initialize: POST http://localhost:8000/api/initialize');
  }
};

// Chat with RAG
const chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Get recent chat history for context
    const historyResult = await pool.query(
      'SELECT message, response FROM chat_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    const history = historyResult.rows.reverse().map(row => ({
      user: row.message,
      assistant: row.response
    }));

    // Call Python RAG service
    const ragResponse = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        k: 5,
        history
      }),
    });

    if (!ragResponse.ok) {
      throw new Error(`RAG service error: ${ragResponse.status}`);
    }

    const ragData = await ragResponse.json();

    // Save to chat history with sources
    // old version 
    // await pool.query(
    //   'INSERT INTO chat_history (user_id, message, response, sources) VALUES ($1, $2, $3, $4)',
    //   [userId, message, ragData.answer, JSON.stringify(ragData.sources)]
    // );

    // new 
    
    await pool.query(
      'INSERT INTO messages (conversation_id, message, response, sources) VALUES ($1, $2, $3, $4)',
      [conversationId, message, ragData.answer, JSON.stringify(ragData.sources)]
    );

    res.json({
      message: ragData.answer,
      sources: ragData.sources
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to get response',
      details: error.message
    });
  }
};

// Get chat history
const getHistory = async (req, res) => {
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
};

module.exports = {
  startPythonRAG,
  initializeEmbeddings,
  chat,
  getHistory
};