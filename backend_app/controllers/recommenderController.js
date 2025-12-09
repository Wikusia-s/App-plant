const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let pythonProcess = null;

const RECOMMENDER_PORT = process.env.RECOMMENDER_PORT || 8030; // zmieniony domyślny port aby uniknąć kolizji i blokad
const RECOMMENDER_HOST = process.env.RECOMMENDER_HOST || '127.0.0.1';

const possiblePythonPaths = (backendDir) => [
  path.join(backendDir, 'venv', 'Scripts', 'python.exe'),
  path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
  'python',
  'python3',
];

const pickPython = (backendDir) => {
  for (const candidate of possiblePythonPaths(backendDir)) {
    if (candidate.includes('venv') && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return 'python';
};

const startRecommenderService = () => {
  if (pythonProcess) {
    console.log('Recommender service already running');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const backendDir = path.join(__dirname, '..');
    const recommenderDir = path.join(backendDir, '..', 'Recommendation_module');
    const pythonCmd = pickPython(backendDir);

    const isWindows = process.platform === 'win32';
    const command = pythonCmd;
    const args = ['-m', 'uvicorn', 'recommender_service:app', '--port', `${RECOMMENDER_PORT}`, '--host', RECOMMENDER_HOST];

    console.log(`Starting recommender service with Python: ${pythonCmd} on ${RECOMMENDER_HOST}:${RECOMMENDER_PORT}`);

    pythonProcess = spawn(command, args, {
      cwd: recommenderDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let startupComplete = false;

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Recommender] ${output.trim()}`);
      if ((output.includes('Application startup complete') || output.includes('Uvicorn running')) && !startupComplete) {
        startupComplete = true;
        console.log(`✓ Recommender service started on port ${RECOMMENDER_PORT}`);
        resolve();
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.log(`[Recommender] ${output.trim()}`);
      if ((output.includes('Application startup complete') || output.includes('Uvicorn running')) && !startupComplete) {
        startupComplete = true;
        console.log(`✓ Recommender service started on port ${RECOMMENDER_PORT}`);
        resolve();
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('❌ Failed to start recommender service:', err.message);
      reject(err);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Recommender process exited with code ${code}`);
      pythonProcess = null;
    });

    setTimeout(() => {
      if (!startupComplete) {
        console.log('⚠️  Recommender startup timeout; continuing but service may be unavailable.');
        resolve();
      }
    }, 20000);
  });
};

const checkRecommenderHealth = async () => {
  try {
    const res = await fetch(`http://${RECOMMENDER_HOST}:${RECOMMENDER_PORT}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.status === 'ok';
  } catch (err) {
    console.log('Recommender healthcheck failed:', err.message);
    return false;
  }
};

module.exports = {
  startRecommenderService,
  checkRecommenderHealth,
};
