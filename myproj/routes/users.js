const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /users/get
router.post('/get', (req, res) => {
  const userId = req.body.userId;

  db.query('SELECT * FROM users WHERE userId = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).render('dashboard', { error: 'Database error', user: null });
    }
    if (results.length === 0) {
      return res.status(404).render('dashboard', { error: 'User not found', user: null });
    }
    res.render('dashboard', { user: results[0], error: null });
  });
});

// POST /users/update-location
router.post('/update-location', (req, res) => {
  const { userId, newLocation } = req.body;

  db.query('UPDATE users SET location = ? WHERE userId = ?', [newLocation, userId], (err) => {
    if (err) {
      return res.status(500).render('dashboard', { error: 'Failed to update location', user: null });
    }

    // Fetch updated user info
    db.query('SELECT * FROM users WHERE userId = ?', [userId], (err2, results) => {
      if (err2 || results.length === 0) {
        return res.status(500).render('dashboard', { error: 'Error fetching updated user info', user: null });
      }
      res.render('dashboard', { user: results[0], error: null });
    });
  });
});

module.exports = router;
