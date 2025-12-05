import React, { useState, useEffect } from 'react';
import './Account.css';
import { chatService } from '../services/chatService';
import { collectionService } from '../services/collectionService';

interface AccountProps {
    user: {
        username: string;
        email: string;
        avatarUrl?: string;
        stats?: {
            plantsAdded: number;
            chatsStarted: number;
            favorites: number;
        };
    } | null;
}

const Account: React.FC<AccountProps> = ({ user }) => {
    const [editing, setEditing] = useState(false);
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [chatCount, setChatCount] = useState(0);
    const [plantCount, setPlantCount] = useState(0);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [conversations, plants] = await Promise.all([
                    chatService.getConversations(),
                    collectionService.getPlants()
                ]);
                setChatCount(conversations.length);
                setPlantCount(plants.length);
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        };

        loadStats();
    }, []);

    if (!user) return <div>Loading...</div>;

    const handleSave = () => {
        // tutaj możesz dodać logikę API do zapisu zmian
        setEditing(false);
        console.log('Saved', { username, email });
    };

    return (
        <div className="account-container">
            <div className="account-header">
                <div className="account-avatar">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" />
                    ) : (
                        <div className="avatar-placeholder">{user.username[0].toUpperCase()}</div>
                    )}
                </div>
                <h2>Account Information</h2>
            </div>

            <div className="account-fields">
                <div className="account-field">
                    <label>Username</label>
                    {editing ? (
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    ) : (
                        <span>{username}</span>
                    )}
                </div>

                <div className="account-field">
                    <label>Email</label>
                    {editing ? (
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    ) : (
                        <span>{email}</span>
                    )}
                </div>

                <button
                    className="edit-btn"
                    onClick={editing ? handleSave : () => setEditing(true)}
                >
                    {editing ? 'Save Changes' : 'Edit Profile'}
                </button>
            </div>

            <div className="account-stats">
                <div className="stat-card">
                    <p className="stat-number">{plantCount}</p>
                    <p className="stat-label">Plants Added</p>
                </div>
                <div className="stat-card">
                    <p className="stat-number">{chatCount}</p>
                    <p className="stat-label">Chats Started</p>
                </div>
                <div className="stat-card">
                    <p className="stat-number">{user.stats?.favorites || 0}</p>
                    <p className="stat-label">Favorites</p>
                </div>
            </div>
        </div>
    );
};

export default Account;
