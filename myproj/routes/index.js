var express = require('express');
var router = express.Router();
const db = require('../db');

// GET home page
router.get('/', function (req, res, next) {
  res.render('index', { error: null });
});

// POST login form
router.post('/login', function (req, res, next) {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.render('index', { error: 'Database error' });
    }

    if (results.length === 0) {
      return res.render('index', { error: 'Invalid username or password' });
    }

    const user = results[0];
    res.render('dashboard', { user: user, error: null });
  });
});

module.exports = router;
