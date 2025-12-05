import React from 'react';
import { Link } from 'react-router-dom';

interface HomePageProps {
  username: string;
}

const HomePage: React.FC<HomePageProps> = ({ username }) => {

  return (
    <main>
      <section className="hero">
        <h1>Welcome back, {username}! 👋</h1>
        <p>
          Your AI-powered plant identification and care assistant. Ask questions about plants,
          get care tips, and identify species from descriptions.
        </p>
        <div className="hero-cta">
          <Link to="/explore" className="cta">
            Start Exploring
          </Link>
        </div>
      </section>

      <section className="card-grid">
        <div className="card">
          <h3>🔍 Identify Plants</h3>
          <p>Describe a plant and get instant identification with care instructions.</p>
        </div>
        <div className="card">
          <h3>💬 Ask Questions</h3>
          <p>Get expert advice on plant care, watering schedules, and common issues.</p>
        </div>
        <div className="card">
          <h3>📚 Learn More</h3>
          <p>Access a comprehensive database of plant species and growing tips.</p>
        </div>
        <div className="card">
          <h3>🌱 Track Growth</h3>
          <p>Monitor your plants' progress and get personalized care reminders.</p>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
