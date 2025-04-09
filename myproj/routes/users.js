const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /user/get
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

module.exports = router;
