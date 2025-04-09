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
    req.user = user; // Store in request for session workaround
    res.render('dashboard', { user });
  });
});

// Dashboard navigation routes
router.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

router.get('/clothing', (req, res) => {
  // Pull userId from query for now
  const userId = req.query.userId;
  if (!userId) {
    return res.render('clothing', { items: [], error: 'User not authenticated' });
  }

  const query = 'SELECT name, type, style, color FROM clothingItems WHERE userId = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.render('clothing', { items: [], error: 'Database error' });
    }
    res.render('clothing', { items: results, error: null });
  });
});

router.get('/outfits', (req, res) => {
  res.render('outfits');
});

router.get('/account', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.render('account', { user: null, error: 'User not authenticated' });
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
