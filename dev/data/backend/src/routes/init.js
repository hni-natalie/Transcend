/*
 routes for initialization or testing
*/
const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ message: 'Hello from Express + Docker!' });
});

router.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

module.exports = router;
