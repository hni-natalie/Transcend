const router      = require('express').Router();
const players     = require('../services/socket.service').players;

// debug, get total active players
router.get('/', (req, res) => {
	res.json({
		count: players.size,
		players: Array.from(players.values())
	});
});

module.exports = router;