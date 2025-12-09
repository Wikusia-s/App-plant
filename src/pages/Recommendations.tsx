import React, { useEffect, useMemo, useState } from 'react';
import './Account.css'; // reuse layout styles
import { recommendationService, RecommendationItem } from '../services/recommendationService';
import { collectionService, Plant } from '../services/collectionService';

const MODE_OPTIONS: Array<{ value: 'hybrid' | 'similar' | 'constraints'; label: string; description: string }> = [
  {
    value: 'hybrid',
    label: 'Hybrid',
    description: 'Uses your seed plants + filters to mix similarity and constraints.',
  },
  {
    value: 'similar',
    label: 'Similar',
    description: 'Finds plants most similar to your seed plants (ignores filters).',
  },
  {
    value: 'constraints',
    label: 'By constraints',
    description: 'Finds plants that best match the filters (ignores seed plants).',
  },
];

const Recommendations: React.FC = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topK, setTopK] = useState<number>(3);
  const [mode, setMode] = useState<'hybrid' | 'similar' | 'constraints'>('hybrid');
  const [showResultsModal, setShowResultsModal] = useState(false);

  const [lightLevel, setLightLevel] = useState<number>(2);
  const [waterLevel, setWaterLevel] = useState<number>(2);
  const [humidityLevel, setHumidityLevel] = useState<number>(2);
  const [difficultyLevel, setDifficultyLevel] = useState<number>(2);
  const [petsSafe, setPetsSafe] = useState<number>(1); // 1 = No, 2 = Yes

  // Map slider values to labels
  const getLevelLabel = (value: number): string => {
    if (value === 1) return 'low';
    if (value === 2) return 'medium';
    if (value === 3) return 'high';
    return '';
  };

  const getPetsSafeLabel = (value: number): string => {
    return value === 1 ? 'No' : 'Yes';
  };

  useEffect(() => {
    collectionService
      .getPlants()
      .then((data) => setPlants(data))
      .catch((err) => setError(err.message || 'Failed to load your plants'));
  }, []);

  const seedPlants = useMemo(
    () =>
      plants
        .map((p) => (p.species || p.name || '').trim())
        .filter(Boolean),
    [plants]
  );

  const submit = async () => {
    setError(null);

    if ((mode === 'hybrid' || mode === 'similar') && seedPlants.length === 0) {
      setError('Add plants to your collection to use this mode.');
      return;
    }

    setLoading(true);
    try {
      let result: RecommendationItem[] = [];
      const payload = {
        light: getLevelLabel(lightLevel),
        water: getLevelLabel(waterLevel),
        humidity: getLevelLabel(humidityLevel),
        pets_safe: petsSafe === 2, // true for Yes, false for No
        difficulty: getLevelLabel(difficultyLevel),
        top_k: topK,
      };

      if (mode === 'hybrid') {
        result = await recommendationService.getHybrid({ ...payload, seed_plants: seedPlants });
      } else if (mode === 'similar') {
        result = await recommendationService.getSimilar(seedPlants, topK);
      } else {
        result = await recommendationService.getByConstraints(payload);
      }
      setRecommendations(result);
      setShowResultsModal(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const renderSlider = (label: string, value: number, onChange: (v: number) => void) => {
    const levelLabel = getLevelLabel(value);
    return (
      <label className="form-row">
        <div className="slider-header">
          <span>{label}</span>
          <span className="slider-value">{levelLabel}</span>
        </div>
        <input
          type="range"
          min="1"
          max="3"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input"
        />
      </label>
    );
  };

  const modeLabel = MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;

  return (
    <div className="account-page">
      <h1>Recommendations</h1>

      <div className="panel-grid" style={{ marginBottom: '16px' }}>
        <div className="card mode-card">
          <h3>Mode</h3>
          <p className="small" style={{ margin: '0 0 12px 0' }}>
            Pick the recommendation mode.
          </p>
          <div className="mode-grid">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`mode-box ${mode === opt.value ? 'mode-box--active' : ''}`}
                onClick={() => setMode(opt.value)}
              >
                <div className="mode-box-title">{opt.label}</div>
                <div className="mode-box-desc">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card filter-card">
          <h3>Filters</h3>
          <p className="small" style={{ margin: '0 0 10px 0' }}>
            Refine by care preferences to tailor your picks.
          </p>
          <div className="form-grid">
            {renderSlider('Light ☀️', lightLevel, setLightLevel)}
            {renderSlider('Water 💧', waterLevel, setWaterLevel)}
            {renderSlider('Humidity 🌿', humidityLevel, setHumidityLevel)}
            {renderSlider('Difficulty 🌱', difficultyLevel, setDifficultyLevel)}
            <label className="form-row">
              <div className="slider-header">
                <span>Pet safe? 🐾</span>
                <span className="slider-value">{getPetsSafeLabel(petsSafe)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="2"
                value={petsSafe}
                onChange={(e) => setPetsSafe(Number(e.target.value))}
                className="slider-input slider-input--binary"
              />
            </label>
            <label className="form-row">
              <span>Top K 🌸</span>
              <input
                type="number"
                min={1}
                max={30}
                value={topK}
                onChange={(e) => setTopK(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
              />
            </label>
          </div>
        </div>

        <div className="card seed-card">
          <h3>Seed plants</h3>
          <p className="small" style={{ margin: '0 0 8px 0' }}>
            We automatically use your collection as seeds.
          </p>
          {plants.length > 0 ? (
            <div className="pill-row" style={{ marginTop: '4px' }}>
              {plants.map((p) => (
                <span key={p.id} className="pill pill--ghost">
                  {p.name} {p.species && p.species !== p.name ? `(${p.species})` : ''}
                </span>
              ))}
            </div>
          ) : (
            <div className="small">Add plants to your collection to enable Hybrid/Similar modes.</div>
          )}
        </div>
      </div>

      <div className="cta-row" style={{ marginBottom: '16px' }}>
        <button className="primary primary--cta" onClick={submit} disabled={loading}>
          {loading ? 'Fetching...' : 'Get recommendations'}
        </button>
        {error && <div className="error-message" style={{ marginTop: '8px' }}>{error}</div>}
        {!error && !loading && recommendations.length === 0 && (
          <div className="small" style={{ marginTop: '8px' }}>
            No results. Try adjusting filters or add plants to your collection.
          </div>
        )}
      </div>

      {showResultsModal && recommendations.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowResultsModal(false)}>
          <div className="results-modal" onClick={(e) => e.stopPropagation()}>
            <div className="results-modal-head">
              <h2>Recommendations</h2>
              <button className="modal-close" onClick={() => setShowResultsModal(false)}>✕</button>
            </div>
            <div className="results-modal-list">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="results-item">
                  <div className="results-item-name">{rec.plant_name}</div>
                  <div className="results-item-score">score: {rec.score.toFixed(3)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
