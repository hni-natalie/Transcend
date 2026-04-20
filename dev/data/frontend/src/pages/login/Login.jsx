import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import authService from '../../services/authService';
import { ROUTE_PATH as R } from '../../config/routes.manifest'

const Login = () => {
	const navigate = useNavigate();
	const [userEmail, setUserEmail] = useState('');
	const [userPassword, setUserPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const onBack = () => { navigate('/'); }

	const handleEmailLogin = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
		const data = await authService.login(userEmail, userPassword);
		console.log('Logged in!', data);

		if (data.user.roleName === 'Admin') {
			navigate(R.ADMIN_DASHBOARD);
		} else {
			navigate(R.USER_DASHBOARD);
		}

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
				Continue with Google
			</button>

			<div className="divider">or</div>

			<form className="email-login-form" onSubmit={handleEmailLogin}>
				<input
				type="email"
				placeholder="Email"
				className="custom-input"
				value={userEmail}
				onChange={(e) => setUserEmail(e.target.value)}
				/>
				<input
				type="password"
				placeholder="Password"
				className="custom-input"
				value={userPassword}
				onChange={(e) => setUserPassword(e.target.value)}
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