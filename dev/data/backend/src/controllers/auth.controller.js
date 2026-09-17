const authService = require('../services/auth.service');
const { validateLogin, validateGoogleLogin } = require('../validators/auth.validator');

function handleAuthError(err, res, fallbackMessage) {
  if (err instanceof authService.AuthError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(fallbackMessage, err);
  return res.status(500).json({ error: 'Internal server error' });
}

async function login(req, res) {
  let userEmail, userPassword;
  try {
    ({ userEmail, userPassword } = validateLogin(req.body));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    const result = await authService.loginWithPassword(userEmail, userPassword);
    res.json(result);
  } catch (err) {
    handleAuthError(err, res, 'Login error:');
  }
}

async function google(req, res) {
  let idToken;
  try {
    ({ idToken } = validateGoogleLogin(req.body));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    const result = await authService.loginWithGoogle(idToken);
    res.json(result);
  } catch (err) {
    handleAuthError(err, res, 'Google login error:');
  }
}

async function me(req, res) {
  try {
    const user = await authService.getCurrentUser(req.user.userId);
    res.json(user);
  } catch (err) {
    handleAuthError(err, res, 'Error in /me:');
  }
}

async function logout(req, res) {
  try {
    await authService.logout(req.user.userId, req.user.workspaceId);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    handleAuthError(err, res, 'Logout error:');
  }
}

module.exports = { login, google, me, logout };