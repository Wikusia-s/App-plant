import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface HomePageProps {
  username: string;
}

interface PlantTask {
  id: number;
  name: string;
  type: 'water' | 'fertilize' | 'prune';
  nextDue: string;
  daysUntil: number;
}

const HomePage: React.FC<HomePageProps> = ({ username }) => {
  // Mock plant tasks for calendar
  const [plantTasks] = useState<PlantTask[]>([
    { id: 1, name: 'Monstera Deliciosa', type: 'water', nextDue: '2025-12-12', daysUntil: 2 },
    { id: 2, name: 'Pothos Golden', type: 'water', nextDue: '2025-12-13', daysUntil: 3 },
    { id: 3, name: 'Snake Plant', type: 'fertilize', nextDue: '2025-12-15', daysUntil: 5 },
    { id: 4, name: 'Fiddle Leaf Fig', type: 'prune', nextDue: '2025-12-18', daysUntil: 8 },
    { id: 5, name: 'Peace Lily', type: 'water', nextDue: '2025-12-11', daysUntil: 1 },
  ]);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'water': return '💧';
      case 'fertilize': return '🌿';
      case 'prune': return '✂️';
      default: return '🌱';
    }
  };

  const getTaskLabel = (type: string) => {
    switch (type) {
      case 'water': return 'Water';
      case 'fertilize': return 'Fertilize';
      case 'prune': return 'Prune';
      default: return 'Care';
    }
  };

  // Sort tasks by days until
  const sortedTasks = [...plantTasks].sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <main className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <h1>Welcome back, {username}!</h1>
          <p>Manage your plant collection and get personalized care tips</p>
        </div>
        <Link to="/explore" className="hero-cta-button">
          Start Exploring
        </Link>
      </section>

      {/* Main Dashboard Grid */}
      <div className="home-dashboard">
        {/* Weather & Notes Card */}
        <section className="home-card home-weather">
          <div className="card-header">
            <h2>🌤️ Today's Weather</h2>
          </div>
          <div className="weather-display">
            <div className="weather-main">
              <div className="weather-temp">25°C</div>
              <div className="weather-condition">Partly Cloudy</div>
            </div>
            <div className="weather-details">
              <div className="detail-item">
                <span className="detail-label"><span className="detail-emoji">💧</span> Humidity</span>
                <span className="detail-value">65%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><span className="detail-emoji">💨</span> Wind</span>
                <span className="detail-value">8 km/h</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><span className="detail-emoji">☀️</span> UV Index</span>
                <span className="detail-value">5</span>
              </div>
            </div>
          </div>

          {/* Your Notes inside weather card */}
          <div className="notes-divider"></div>
          <div className="card-header notes-header">
            <h2>📝 Your Notes</h2>
          </div>
          <div className="notes-content">
            <div className="note-line"></div>
            <div className="note-line"></div>
            <div className="note-line"></div>
            <div className="note-line"></div>
            <div className="note-line"></div>
          </div>
        </section>

        {/* Care Calendar */}
        <section className="home-card home-calendar">
          <div className="card-header">
            <h2>📅 Care Schedule</h2>
            <Link to="/explore" className="view-all-link">View all</Link>
          </div>
          <div className="calendar-tasks">
            {sortedTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-icon">{getTaskIcon(task.type)}</div>
                <div className="task-info">
                  <div className="task-name">{task.name}</div>
                  <div className="task-type">{getTaskLabel(task.type)}</div>
                </div>
                <div className={`task-due due-${task.daysUntil <= 1 ? 'urgent' : task.daysUntil <= 3 ? 'soon' : 'later'}`}>
                  {task.daysUntil === 0 ? 'Today' : task.daysUntil === 1 ? 'Tomorrow' : `In ${task.daysUntil}d`}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Quick Actions Grid */}
      <section className="home-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <div className="action-card">
            <div className="action-icon">🔍</div>
            <h3>Identify Plants</h3>
            <p>Describe a plant and get instant identification</p>
          </div>
          <div className="action-card">
            <div className="action-icon">💬</div>
            <h3>Ask Questions</h3>
            <p>Get expert advice on plant care</p>
          </div>
          <div className="action-card">
            <div className="action-icon">📚</div>
            <h3>Learn More</h3>
            <p>Access our plant database</p>
          </div>
          <div className="action-card">
            <div className="action-icon">🌱</div>
            <h3>Track Growth</h3>
            <p>Monitor your plants' progress</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
