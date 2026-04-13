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

// role checker - no db query, just checks jwt
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        if (!allowedRoles.includes(req.user.roleName)) {
            return res.status(403).json({ 
                error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
                yourRole: req.user.roleName
            });
        }
        
        next();
    };
}

// shortcuts
// can use this to enforce permissions (see example below)
const requireAdmin = requireRole(['Admin']);
const requireManager = requireRole(['Manager']);
const requireTeamLeader = requireRole(['Team Leader']);

module.exports = { authMiddleware, requireRole, requireAdmin, requireManager, requireTeamLeader };

/* 
// PERMISSION: View spaces (anyone logged in)
router.get('/spaces', authMiddleware, spaceController.getAllSpaces);

// PERMISSION: Create booking (anyone logged in)
router.post('/bookings', authMiddleware, bookingController.create);

// PERMISSION: Edit space (requires Manager or Admin)
router.put('/spaces/:id', authMiddleware, requireRole(['Admin', 'Manager']), spaceController.update);

// PERMISSION: Delete space (requires Admin only)
router.delete('/spaces/:id', authMiddleware, requireRole(['Admin']), spaceController.delete);

// PERMISSION: View all users (requires Admin only)
router.get('/admin/users', authMiddleware, requireRole(['Admin']), userController.getAllUsers);
*/
