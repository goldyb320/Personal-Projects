const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /users/get
router.post('/get', (req, res) => {
  const userId = req.body.userId;

  db.query('SELECT * FROM users WHERE userId = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).render('account', { error: 'Database error', user: null });
    }
    if (results.length === 0) {
      return res.status(404).render('account', { error: 'User not found', user: null });
    }
    res.render('account', { user: results[0], error: null });
  });
});

// POST /users/update-location
router.post('/update-location', (req, res) => {
  const { userId, location } = req.body;

  db.query('UPDATE users SET location = ? WHERE userId = ?', [location, userId], (err, result) => {
    if (err) {
      return res.status(500).render('account', { error: 'Database error', user: null });
    }

    db.query('SELECT * FROM users WHERE userId = ?', [userId], (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).render('account', { error: 'Error retrieving user after update', user: null });
      }

      res.render('account', { user: results[0], error: null });
    });
  });
});

// POST /users/delete
router.post('/delete', (req, res) => {
  const userId = req.body.userId;

  db.query('DELETE FROM users WHERE userId = ?', [userId], (err, result) => {
    if (err) {
      return res.status(500).send('Failed to delete account.');
    }

    // Redirect back to login page after deletion
    res.redirect('/');
  });
});

module.exports = router;
