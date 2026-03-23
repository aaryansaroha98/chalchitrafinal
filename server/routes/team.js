const express = require('express');
const db = require('../database');

const router = express.Router();

// Get all team members (public endpoint for team page)
router.get('/', (req, res) => {
  db.all('SELECT * FROM team ORDER BY section, display_order, name', [], (err, team) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(team);
  });
});

module.exports = router;
