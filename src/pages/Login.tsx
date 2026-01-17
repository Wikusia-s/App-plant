import React, { useState, FormEvent, ChangeEvent } from 'react';
import { authService } from '../services/authService';
import '../styles.css';

interface LoginProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

interface FormData {
  email: string;
  password: string;
}

const Login: React.FC<LoginProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotMessage, setForgotMessage] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.login(formData.email, formData.password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');

    try {
      // TODO: Connect to actual backend endpoint for password reset
      // await authService.resetPassword(forgotEmail);
      setForgotMessage('A temporary password has been sent to your email. Please check your inbox.');
      setForgotEmail('');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotMessage('');
      }, 3000);
    } catch (err) {
      setForgotMessage(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setForgotLoading(false);
    }
  };

  // Plant images for background animation
  const plantImages = [
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=200',
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=200',
    'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=200',
    'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=200',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=200',
    'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=200',
    'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=200',
    'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=200',
    'https://images.unsplash.com/photo-1483794344563-d27a8d18014e?w=200',
  ];

  return (
    <div className="auth-container">
      {/* Animated background with plant images */}
      <div className="auth-bg-animation">
        {plantImages.map((img, index) => (
          <div
            key={index}
            className="plant-square"
            style={{
              backgroundImage: `url(${img})`,
              animationDelay: `${index * 0.8}s`,
              left: `${(index % 5) * 20}%`,
              top: `${Math.floor(index / 5) * 50}%`
            }}
          />
        ))}
      </div>
      <div className="auth-card">
        <h2>Login to Plantify</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="auth-forgot">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="link-button"
              type="button"
            >
              Forgot your password?
            </button>
          </p>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="link-button" type="button">
            Register here
          </button>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Reset Password</h3>
            <p className="modal-description">Enter your email address and we'll send you a temporary password.</p>

            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label htmlFor="forgot-email">Email</label>
                <input
                  type="email"
                  id="forgot-email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  disabled={forgotLoading}
                  placeholder="Enter your email"
                />
              </div>

              {forgotMessage && (
                <div className={forgotMessage.includes('sent') ? 'success-message' : 'error-message'}>
                  {forgotMessage}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={forgotLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="auth-button"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Sending...' : 'Send Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
