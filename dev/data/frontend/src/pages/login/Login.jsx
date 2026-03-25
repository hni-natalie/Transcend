import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import authService from '../../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onBack = () => { navigate('/'); }

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      console.log('Logged in!', data);
      // redirect to dashboard here
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authService.loginWithGoogle();
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-content-card">
        <h1 className="brand-logo" onClick={onBack}>WorkFrom,</h1>

        <div className="auth-container">
          <button className="google-auth-button" onClick={handleGoogleLogin}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#fff" d="M12.48 10.92v3.28h7.84c-.24 1.84-.909 3.148-1.908 4.148-1.248 1.248-3.148 2.64-6.32 2.64-5.124 0-9.212-4.148-9.212-9.212s4.088-9.212 9.212-9.212c2.784 0 4.848 1.104 6.36 2.52l2.316-2.316C18.42 1.188 15.696 0 12.48 0 5.592 0 0 5.592 0 12.48s5.592 12.48 12.48 12.48c3.708 0 6.516-1.212 8.712-3.516 2.256-2.256 2.964-5.388 2.964-7.812 0-.756-.06-1.464-.18-2.112H12.48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider">or</div>

          <form className="email-login-form" onSubmit={handleEmailLogin}>
            <input
              type="email"
              placeholder="Email"
              className="custom-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="custom-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="primary-login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>

            <p className="error-message">{error}</p>
          </form>
        </div>
        <div className="login-helper-text">
          <p>No account? <span className="highlight">Contact us</span>.</p>
          <p className="legal-disclaimer">
            By continuing, you acknowledge that you understand <br />
            and agree to the <span className="highlight">Terms & Conditions</span>
            and <span className="highlight">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;