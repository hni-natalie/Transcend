const fs = require('fs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();

function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return res.status(401).json({ error: 'Authorization header missing' });
	}

	const [scheme, token] = authHeader.split(' ');

	if (scheme !== 'Bearer' || !token) {
		return res.status(401).json({ error: 'Invalid authorization format' });
	}

	try {
		req.user = jwt.verify(token, JWT_SECRET);
		return next();
	} catch (error) {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
}

module.exports = authMiddleware;
