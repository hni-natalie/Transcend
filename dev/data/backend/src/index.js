const express = require('express');
const app = express();
const port = process.env.BACKEND_PORT || 3000;

// import different routes
const initRoutes = require('./routes/init');

app.use('/', initRoutes)

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});