// backend/app.js
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Backend service is running');
});

module.exports = app;