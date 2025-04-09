var express = require('express');
var router = express.Router();
const db = require('../db');

// GET home page
router.get('/', function (req, res) {
  res.render('index', { error: null });
});

// POST login form
router.post('/login', function (req, res) {
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
    req.session.userId = user.userId;
    res.redirect('/dashboard'); // 🔁 Now goes to dashboard first!
  });
});

// GET dashboard
router.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }

  res.render('dashboard');
});

// Navigation buttons
router.get('/clothing', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  res.render('clothing');
});

router.get('/outfits', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  res.render('outfits');
});

router.get('/account', (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect('/');
  }

  const query = 'SELECT * FROM users WHERE userId = ?';
  db.query(query, [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.render('account', { user: null, error: 'User not found' });
    }
    res.render('account', { user: results[0], error: null });
  });
});

module.exports = router;
