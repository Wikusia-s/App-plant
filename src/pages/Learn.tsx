import React from 'react';
import './Account.css'; // reuse layout styles
import { Link } from 'react-router-dom';

const Learn: React.FC = () => {
    return (
        <div className="account-page">
            <h1>Plant Care Guide</h1>
            <p style={{ marginBottom: '24px', fontSize: '16px', color: 'var(--ink-secondary)' }}>
                Master the basics of plant care and become a confident plant parent.
            </p>

            <div className="panel-grid" style={{ marginBottom: '24px' }}>
                {/* Watering */}
                <div className="card">
                    <h3>💧 Watering</h3>
                    <p className="small">
                        Most plants need water when the top inch of soil feels dry. Check your soil regularly and adjust based on humidity, season, and plant type. Overwatering is one of the most common mistakes — if in doubt, wait a day!
                    </p>
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--panel-secondary)', borderRadius: '8px', fontSize: '13px' }}>
                        <strong>💡 Tip:</strong> Water in the morning when soil temperatures are cooler. This reduces evaporation and helps roots absorb moisture better.
                    </div>
                </div>

                {/* Light */}
                <div className="card">
                    <h3>☀️ Light Conditions</h3>
                    <p className="small">
                        Plants need light to photosynthesize and grow. Different plants have different light needs:
                    </p>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '14px' }}>
                        <li><strong>Low light:</strong> Indirect sunlight, 2-4 hours of natural light daily</li>
                        <li><strong>Medium light:</strong> Bright indirect light, 4-6 hours daily</li>
                        <li><strong>High light:</strong> Direct sunlight, 6+ hours daily</li>
                    </ul>
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--panel-secondary)', borderRadius: '8px', fontSize: '13px' }}>
                        <strong>💡 Tip:</strong> Rotate your plant every few weeks to ensure even growth on all sides.
                    </div>
                </div>

                {/* Humidity */}
                <div className="card">
                    <h3>🌿 Humidity & Temperature</h3>
                    <p className="small">
                        Many tropical plants thrive in humid environments. Keep humidity between 40-60% for most plants. Group plants together to increase humidity naturally, or mist their leaves regularly.
                    </p>
                    <p style={{ marginTop: '8px', fontSize: '13px' }}>
                        Most plants prefer temperatures between 18-25°C (65-77°F). Avoid placing plants near:
                    </p>
                    <ul style={{ paddingLeft: '20px', fontSize: '14px' }}>
                        <li>Cold drafts and heat vents</li>
                        <li>Direct heating sources</li>
                        <li>Sudden temperature changes</li>
                    </ul>
                </div>

                {/* Soil & Nutrients */}
                <div className="card">
                    <h3>🌱 Soil & Nutrients</h3>
                    <p className="small">
                        Good soil is the foundation of healthy plants. Most houseplants do well in well-draining potting soil. Fertilize your plants during the growing season (spring and summer) every 2-4 weeks.
                    </p>
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--panel-secondary)', borderRadius: '8px', fontSize: '13px' }}>
                        <strong>💡 Tip:</strong> Watch for signs of over-fertilizing: brown leaf tips, salt buildup on soil, or stunted growth. When in doubt, fertilize less frequently.
                    </div>
                </div>

                {/* Pests & Diseases */}
                <div className="card">
                    <h3>🐛 Common Pests & Prevention</h3>
                    <p className="small">
                        Indoor plants can attract spider mites, mealybugs, and scale insects. Inspect new plants before bringing them home and check your collection regularly.
                    </p>
                    <p style={{ marginTop: '8px', fontSize: '13px' }}>
                        <strong>Prevention:</strong> Keep leaves clean with a soft cloth, maintain good airflow, and isolate affected plants immediately.
                    </p>
                    <p style={{ fontSize: '13px', marginTop: '8px' }}>
                        <strong>Treatment:</strong> Neem oil spray is effective for most common pests. Repeat every 5-7 days until the infestation clears.
                    </p>
                </div>

                {/* Repotting */}
                <div className="card">
                    <h3>🪴 Repotting & Pruning</h3>
                    <p className="small">
                        Repot your plant when roots start to circle the bottom of the pot or emerge from drainage holes. Spring is the best time. Use a pot only 1-2 inches larger than the current one.
                    </p>
                    <p style={{ marginTop: '8px', fontSize: '13px' }}>
                        <strong>Pruning:</strong> Remove dead leaves and stems to encourage new growth. Pinch off the top of stems to create a bushier plant.
                    </p>
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--panel-secondary)', borderRadius: '8px', fontSize: '13px' }}>
                        <strong>💡 Tip:</strong> Always use clean scissors or pruning shears to prevent disease transmission between plants.
                    </div>
                </div>

                {/* Pet Safety */}
                <div className="card">
                    <h3>🐾 Pet-Safe Plants</h3>
                    <p className="small">
                        Many common houseplants are toxic to cats and dogs. If you have pets, choose from our list of safe plants like:
                    </p>
                    <ul style={{ paddingLeft: '20px', fontSize: '14px', marginTop: '8px' }}>
                        <li>Spider plants</li>
                        <li>Boston ferns</li>
                        <li>African violets</li>
                        <li>Bamboo palms</li>
                        <li>Prayer plants</li>
                    </ul>
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--panel-secondary)', borderRadius: '8px', fontSize: '13px' }}>
                        <strong>⚠️ Important:</strong> Always check if a plant is safe before bringing it home. When in doubt, call your vet.
                    </div>
                </div>

                {/* Seasonal Care */}
                <div className="card">
                    <h3>🍂 Seasonal Care Tips</h3>
                    <p className="small" style={{ marginBottom: '8px' }}>
                        <strong>Spring & Summer:</strong> Growing season — water more frequently, fertilize, and prune as needed.
                    </p>
                    <p className="small" style={{ marginBottom: '8px' }}>
                        <strong>Fall & Winter:</strong> Dormancy period — reduce watering and fertilizing, minimize fertilizer, and provide extra light if needed.
                    </p>
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--panel-secondary)', borderRadius: '8px', fontSize: '13px' }}>
                        <strong>💡 Tip:</strong> Adjust your care routine as seasons change to keep your plants healthy year-round.
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <section style={{ marginTop: '32px', padding: '24px', backgroundColor: 'var(--panel)', borderRadius: '12px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '12px' }}>Ready to Get Personalized Recommendations?</h2>
                <p style={{ marginBottom: '16px', color: 'var(--ink-secondary)' }}>
                    Use our smart recommendation engine to find plants that match your environment and care level.
                </p>
                <Link to="/recommendations" className="primary primary--cta">
                    Explore Recommendations
                </Link>
            </section>
        </div>
    );
};

export default Learn;
