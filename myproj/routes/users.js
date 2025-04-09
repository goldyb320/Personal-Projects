const express = require('express');
const router = express.Router();
const db = require('../db');

// POST to update user location
router.post('/update-location', (req, res) => {
  const { userId, location } = req.body;

  db.query('UPDATE users SET location = ? WHERE userId = ?', [location, userId], (err, results) => {
    if (err) {
      return res.render('account', { user: null, error: 'Failed to update location.' });
    }

    // Fetch updated user
    db.query('SELECT * FROM users WHERE userId = ?', [userId], (err2, updated) => {
      if (err2 || updated.length === 0) {
        return res.render('account', { user: null, error: 'Error fetching updated user info.' });
      }

      res.render('account', { user: updated[0], error: null });
    });
  });
});

module.exports = router;
