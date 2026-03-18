const express = require('express');
const app = express();
const port = process.env.BACKEND_PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express + Docker!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
