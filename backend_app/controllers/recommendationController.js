const pool = require('../config/database');

const RECOMMENDER_HOST = process.env.RECOMMENDER_HOST || '127.0.0.1';
const RECOMMENDER_PORT = process.env.RECOMMENDER_PORT || 8030;
const RECOMMENDER_URL = process.env.RECOMMENDER_URL || `http://${RECOMMENDER_HOST}:${RECOMMENDER_PORT}`;

const numberOrDefault = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const getSeedPlants = async (userId, provided) => {
  if (Array.isArray(provided) && provided.length) {
    return provided;
  }

  // Używamy kolumny species zamiast name, bo species powinno pasować do nazw w plant_articles.json
  const result = await pool.query(
    'SELECT species FROM plants WHERE user_id = $1 AND species IS NOT NULL ORDER BY created_at DESC',
    [userId]
  );
  return result.rows.map((r) => r.species).filter(Boolean);
};

const buildConstraints = (body) => ({
  light: body.light ?? null,
  water: body.water ?? null,
  humidity: body.humidity ?? null,
  pets_safe: body.pets_safe ?? null,
  difficulty: body.difficulty ?? null,
  top_k: numberOrDefault(body.top_k, 10),
});

const forward = async (path, payload) => {
  const response = await fetch(`${RECOMMENDER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Recommender error ${response.status}: ${text}`);
  }

  return response.json();
};

const recommendSimilar = async (req, res) => {
  try {
    const seed_plants = await getSeedPlants(req.user.id, req.body.seed_plants);
    if (!seed_plants.length) {
      return res.status(400).json({ error: 'Brak roślin użytkownika do rekomendacji (seed_plants).' });
    }

    const top_k = numberOrDefault(req.body.top_k, 10);
    const response = await fetch(`${RECOMMENDER_URL}/recommend/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed_plants, top_k }),
    });

    if (!response.ok) {
      const text = await response.text();
      const status = response.status;
      return res.status(status).json({ error: `Recommender error ${status}: ${text}` });
    }

    const data = await response.json();
    res.json({ recommendations: data });
  } catch (err) {
    console.error('recommendSimilar error:', err.message);
    res.status(500).json({ error: 'Failed to get similar recommendations', details: err.message });
  }
};

const recommendConstraints = async (req, res) => {
  try {
    const constraints = buildConstraints(req.body);
    const data = await forward('/recommend/constraints', constraints);
    res.json({ recommendations: data });
  } catch (err) {
    console.error('recommendConstraints error:', err.message);
    res.status(500).json({ error: 'Failed to get constraint recommendations', details: err.message });
  }
};

const recommendHybrid = async (req, res) => {
  try {
    const seed_plants = await getSeedPlants(req.user.id, req.body.seed_plants);
    if (!seed_plants.length) {
      return res.status(400).json({ error: 'Brak roślin użytkownika do rekomendacji (seed_plants).' });
    }

    const constraints = buildConstraints(req.body);
    const payload = { ...constraints, seed_plants };
    const response = await fetch(`${RECOMMENDER_URL}/recommend/hybrid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      const status = response.status;
      return res.status(status).json({ error: `Recommender error ${status}: ${text}` });
    }

    const data = await response.json();
    res.json({ recommendations: data });
  } catch (err) {
    console.error('recommendHybrid error:', err.message);
    res.status(500).json({ error: 'Failed to get hybrid recommendations', details: err.message });
  }
};

module.exports = {
  recommendSimilar,
  recommendConstraints,
  recommendHybrid,
};
