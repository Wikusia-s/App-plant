import React, { useEffect, useState } from 'react';
import './Account.css'; // reuse layout styles
import { careService } from '../services/careService';
import { collectionService } from '../services/collectionService';
import type { CareTask } from '../types';
import { Link } from 'react-router-dom';

const Track: React.FC = () => {
    const [tasks, setTasks] = useState<CareTask[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'water': return '💧';
            case 'fertilize': return '🌿';
            case 'prune': return '✂️';
            case 'repot': return '🪴';
            case 'custom': return '✨';
            default: return '🌱';
        }
    };

    const getTaskLabel = (type: string) => {
        switch (type) {
            case 'water': return 'Water';
            case 'fertilize': return 'Fertilize';
            case 'prune': return 'Prune';
            case 'repot': return 'Repot';
            case 'custom': return 'Custom';
            default: return 'Care';
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const taskList = await careService.getTasks();
                setTasks(taskList);
            } catch (err) {
                console.error('Error loading care tasks:', err);
                setError('Failed to load care schedule');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const sortedTasks = [...tasks].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

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
        <div className="account-page">
            <h1>Track Your Plants</h1>
            <p style={{ marginBottom: '24px', fontSize: '16px', color: 'var(--ink-secondary)' }}>
                Monitor your plant care schedule and track progress over time.
            </p>

            {/* Care Schedule Card */}
            <div className="panel-grid" style={{ marginBottom: '24px' }}>
                <div className="card">
                    <div className="card-header">
                        <h2>📅 Care Schedule</h2>
                    </div>
                    <div className="calendar-tasks">
                        {loading && <div>Loading schedule...</div>}
                        {error && <div className="error">{error}</div>}
                        {!loading && !error && sortedTasks.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-secondary)' }}>
                                No upcoming tasks. Your plants are all set! 🌿
                            </div>
                        )}
                        {!loading && !error && sortedTasks.length > 0 && (
                            <div>
                                {sortedTasks.map((task) => {
                                    const daysUntil = Math.max(0, Math.ceil((new Date(task.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                                    const isCompleted = task.status === 'done';
                                    return (
                                        <div
                                            key={task.id}
                                            className="task-item"
                                            style={{
                                                opacity: isCompleted ? 0.6 : 1,
                                                textDecoration: isCompleted ? 'line-through' : 'none',
                                            }}
                                        >
                                            <div className="task-icon">{getTaskIcon(task.type)}</div>
                                            <div className="task-info">
                                                <div className="task-name">{task.title || task.plant_name || 'Care task'}</div>
                                                <div className="task-type">{getTaskLabel(task.type)}</div>
                                            </div>
                                            <div className={`task-due due-${daysUntil <= 1 ? 'urgent' : daysUntil <= 3 ? 'soon' : 'later'}`}>
                                                {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil}d`}
                                            </div>
                                            <div className="task-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                                {!isCompleted && (
                                                    <button className="pill" onClick={() => markDone(task.id)}>Done</button>
                                                )}
                                                <button className="pill pill--ghost" onClick={() => deleteTask(task.id)}>Delete</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            {!loading && !error && sortedTasks.length > 0 && (
                <div className="panel-grid" style={{ marginBottom: '24px' }}>
                    <div className="card">
                        <h3>📊 Quick Stats</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                            <div style={{ padding: '12px', backgroundColor: 'var(--panel-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>
                                    {sortedTasks.filter(t => t.status === 'done').length}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginTop: '4px' }}>
                                    Completed tasks
                                </div>
                            </div>
                            <div style={{ padding: '12px', backgroundColor: 'var(--panel-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>
                                    {sortedTasks.filter(t => t.status !== 'done').length}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginTop: '4px' }}>
                                    Pending tasks
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3>⏰ Upcoming</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                            <div style={{ padding: '12px', backgroundColor: 'var(--panel-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>
                                    {sortedTasks.filter(t => t.status !== 'done' && Math.ceil((new Date(t.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 1).length}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginTop: '4px' }}>
                                    Due today/tomorrow
                                </div>
                            </div>
                            <div style={{ padding: '12px', backgroundColor: 'var(--panel-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffd43b' }}>
                                    {sortedTasks.filter(t => t.status !== 'done' && Math.ceil((new Date(t.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) > 1).length}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginTop: '4px' }}>
                                    Later this week
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CTA Section */}
            <section style={{ marginTop: '32px', padding: '24px', backgroundColor: 'var(--panel)', borderRadius: '12px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '12px' }}>Need Plant Care Tips?</h2>
                <p style={{ marginBottom: '16px', color: 'var(--ink-secondary)' }}>
                    Check out our comprehensive plant care guide for watering, light, and more.
                </p>
                <Link to="/learn" className="primary primary--cta">
                    View Care Guide
                </Link>
            </section>
        </div>
    );
};

export default Track;
