import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { careService } from '../services/careService';
import { collectionService } from '../services/collectionService';
import type { CareTask } from '../types';

interface HomePageProps {
  username: string;
}

interface PlantOption { id: number; name: string; }

const HomePage: React.FC<HomePageProps> = ({ username }) => {
  // Care tasks from API
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Modal state for adding a task
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [plants, setPlants] = useState<PlantOption[]>([]);
  const [newTaskPlantId, setNewTaskPlantId] = useState<number | null>(null);
  const [newTaskType, setNewTaskType] = useState<CareTask['type']>('water');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDueAt, setNewTaskDueAt] = useState<string>(''); // date-only

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

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingTasks(true);
        const [taskList, plantList] = await Promise.all([
          careService.getTasks(),
          collectionService.getPlants().then(p => p.map(pl => ({ id: pl.id, name: pl.name })))
        ]);
        setTasks(taskList);
        setPlants(plantList);
      } catch (err) {
        console.error('Error loading care tasks:', err);
        setTaskError('Failed to load care schedule');
      } finally {
        setLoadingTasks(false);
      }
    };
    load();
  }, []);

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

  const addTask = async () => {
    if (!newTaskDueAt || !newTaskType) {
      alert('Please choose type and due date');
      return;
    }
    try {
      const iso = new Date(newTaskDueAt).toISOString();
      const task = await careService.addTask({
        plant_id: newTaskPlantId ?? null,
        type: newTaskType,
        title: newTaskTitle || null,
        due_at: iso,
        notes: null,
      });
      setTasks(prev => [...prev, task]);
      setShowAddModal(false);
      setNewTaskPlantId(null);
      setNewTaskType('water');
      setNewTaskTitle('');
      setNewTaskDueAt('');
    } catch (err) {
      console.error('Error adding task:', err);
      alert('Failed to add task');
    }
  };

  const markDone = async (taskId: number) => {
    try {
      const updated = await careService.updateTask(taskId, { status: 'done' });
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error('Error marking done:', err);
      alert('Failed to update task');
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await careService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task');
    }
  };

  return (
    <main className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <h1>Welcome back, {username}!</h1>
          <p>Manage your plant collection and get personalized care tips</p>
        </div>
        <Link to="/collection" className="hero-cta-button">
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
            {loadingTasks && <div>Loading schedule...</div>}
            {taskError && <div className="error">{taskError}</div>}
            {!loadingTasks && !taskError && sortedTasks.length === 0 && (
              <div>No upcoming tasks — add one below.</div>
            )}
            {!loadingTasks && !taskError && sortedTasks.slice(0, 5).map((task) => {
              const daysUntil = Math.max(0, Math.ceil((new Date(task.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              return (
                <div key={task.id} className="task-item">
                  <div className="task-icon">{getTaskIcon(task.type)}</div>
                  <div className="task-info">
                    <div className="task-name">{task.title || task.plant_name || 'Care task'}</div>
                    <div className="task-type">{getTaskLabel(task.type)}</div>
                  </div>
                  <div className={`task-due due-${daysUntil <= 1 ? 'urgent' : daysUntil <= 3 ? 'soon' : 'later'}`}>
                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil}d`}
                  </div>
                  <div className="task-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {task.status !== 'done' && (
                      <button className="pill" onClick={() => markDone(task.id)}>Done</button>
                    )}
                    <button className="pill pill--ghost" onClick={() => deleteTask(task.id)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="add-task-btn" onClick={() => setShowAddModal(true)}>Add Task</button>
          </div>
        </section>
        {showAddModal && (
          <div className="modal-overlay">
            <div className="care-modal">
              <button className="modal-close" aria-label="Close" onClick={() => setShowAddModal(false)}>✕</button>
              <div className="care-accent"></div>
              <div className="care-modal__header">
                <span className="care-badge">Care schedule</span>
                <h2>Add care task</h2>
                <p>Plan watering, fertilizing, pruning or custom chores with a clear due time.</p>
              </div>
              <div className="care-modal__grid">
                <div className="care-card">
                  <h3>Task basics</h3>
                  <label>Plant (optional)</label>
                  <select value={newTaskPlantId ?? ''} onChange={(e) => {
                    const val = e.target.value;
                    setNewTaskPlantId(val ? Number(val) : null);
                  }}>
                    <option value="">None</option>
                    {plants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <label>Type</label>
                  <div className="care-type-row">
                    {[
                      { value: 'water', label: 'Water 💧' },
                      { value: 'fertilize', label: 'Fertilize 🌿' },
                      { value: 'prune', label: 'Prune ✂️' },
                      { value: 'repot', label: 'Repot 🪴' },
                      { value: 'custom', label: 'Custom ✨' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={opt.value === newTaskType ? 'chip chip--active' : 'chip'}
                        onClick={() => setNewTaskType(opt.value as CareTask['type'])}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <label>Title (optional)</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g., Water Monstera"
                  />

                  <div className="care-row">
                    <div className="care-field">
                      <label>Due date</label>
                      <input
                        type="date"
                        value={newTaskDueAt}
                        onChange={(e) => setNewTaskDueAt(e.target.value)}
                      />
                    </div>
                    <div className="care-field">
                      <label>Status</label>
                      <div className="care-status-pill">Pending</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="care-modal__actions">
                <button className="primary" onClick={addTask}>Save task</button>
                <button className="pill pill--ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <section className="home-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/collection" className="action-card">
            <div className="action-icon">🔍</div>
            <h3>Identify Plants</h3>
            <p>Describe a plant and get instant identification</p>
          </Link>
          <Link to="/chat" className="action-card">
            <div className="action-icon">💬</div>
            <h3>Ask Questions</h3>
            <p>Get expert advice on plant care</p>
          </Link>
          <Link to="/learn" className="action-card">
            <div className="action-icon">📚</div>
            <h3>Learn More</h3>
            <p>Access our plant database</p>
          </Link>
          <Link to="/track" className="action-card">
            <div className="action-icon">🌱</div>
            <h3>Track Growth</h3>
            <p>Monitor your plants' progress</p>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
