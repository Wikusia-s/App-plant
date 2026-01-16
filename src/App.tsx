import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import Collection from './pages/Collection';
import Recommendations from './pages/Recommendations';
import Account from './pages/Account';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import { authService } from './services/authService';
import './styles.css';

interface User {
  id: number;
  username: string;
  email: string;
}

function App() {
  const plantIcon = '🌿';

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showRegister, setShowRegister] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setUser(authService.getCurrentUser());
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return showRegister ? (
      <Register
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <Login
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app__header">
        <div className="brand">
          <button
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <div className="brand__logo" aria-hidden="true">{plantIcon}</div>
          <span>Plantify</span>
        </div>

        <div className="user-info">
          <span className="small">Welcome, {user?.username}!</span>
          <Link to="/account" className="user-action">
            Account
          </Link>
          <button
            onClick={handleLogout}
            className="user-action"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <Link to="/" className="link-btn sidebar-link">
          Home
        </Link>
        <Link to="/chat" className="link-btn sidebar-link">
          Chat
        </Link>
        <Link to="/collection" className="link-btn sidebar-link">
          Collection
        </Link>
        <Link to="/recommendations" className="link-btn sidebar-link">
          Recommendations
        </Link>

        {/* Settings na dole */}
        <div className="sidebar-bottom">
          <Link to="/settings" className="sidebar-link">
            <span aria-hidden="true">{plantIcon}</span>
            <span style={{ marginLeft: 8 }}>Settings</span>
          </Link>
        </div>
      </div>


      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage username={user?.username || ''} />} />
          <Route path="/chat" element={<Chat user={user} />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/account" element={<Account user={user} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div >
  );
}

export default App;
