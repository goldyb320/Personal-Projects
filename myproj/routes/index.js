const express = require('express');
const router = express.Router();
const db = require('../db');

// GET login page
router.get('/', (req, res) => {
  res.render('index', { error: null });
});

// POST login form
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) return res.render('index', { error: 'Database error' });
    if (results.length === 0) return res.render('index', { error: 'Invalid username or password' });

    const user = results[0];
    res.redirect(`/dashboard?userId=${user.userId}`);
  });
});

// GET registration form
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// POST registration form
router.post('/register', (req, res) => {
  const { username, password, firstName, lastName, address, location } = req.body;

  if (!username || !password || !firstName || !lastName || !address || !location) {
    return res.render('register', { error: 'All fields are required' });
  }

  const getMaxIdQuery = 'SELECT MAX(userId) AS maxId FROM users';
  db.query(getMaxIdQuery, (err, maxResults) => {
    if (err) return res.render('register', { error: 'Database error' });

    const nextUserId = (maxResults[0].maxId || 0) + 1;

    const insertQuery = `
      INSERT INTO users (userId, username, password, firstName, lastName, address, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(insertQuery, [nextUserId, username, password, firstName, lastName, address, location], (err) => {
      if (err) return res.render('register', { error: 'Failed to create account' });
      res.redirect('/');
    });
  });
});

// GET dashboard
router.get('/dashboard', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.redirect('/');
  res.render('dashboard', { user: { userId }, userId });
});

// GET clothing items
router.get('/clothing', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.render('clothing', { items: [], error: 'User not authenticated' });

  const query = 'SELECT name, type, style, color FROM clothingItems WHERE userId = ?';
  db.query(query, [userId], (err, results) => {
    if (err) return res.render('clothing', { items: [], error: 'Database error' });
    res.render('clothing', { items: results, error: null, userId });
  });
});

// GET outfits page
router.get('/outfits', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.render('outfits', {
      outfits: [],
      error: 'User not authenticated',
      userId: null
    });
  }

  const query = `
    SELECT o.outfitId, o.outfitStyle,
           t1.name AS top1, t2.name AS top2, b.name AS bottom
    FROM outfits o
    JOIN clothingItems t1 ON o.topLayer1 = t1.clothingId
    LEFT JOIN clothingItems t2 ON o.topLayer2 = t2.clothingId
    JOIN clothingItems b ON o.bottom = b.clothingId
    WHERE t1.userId = ? AND (t2.userId = ? OR t2.userId IS NULL) AND b.userId = ?
    ORDER BY o.outfitStyle ASC;
  `;

  db.query(query, [userId, userId, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.render('outfits', {
        outfits: [],
        error: 'Database error',
        userId
      });
    }

    // ✅ Always pass outfits and userId, even if no results
    res.render('outfits', {
      outfits: results || [],
      error: null,
      userId
    });
  });
});


// GET account page
router.get('/account', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.render('account', { user: null, error: 'User not authenticated' });

  const query = 'SELECT * FROM users WHERE userId = ?';
  db.query(query, [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.render('account', { user: null, error: 'User not found' });
    }
    res.render('account', { user: results[0], error: null });
  });
});

// DELETE ACCOUNT route
router.post('/delete-account', (req, res) => {
  const userId = req.body.userId;

  const query = 'DELETE FROM users WHERE userId = ?';
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.send('Error deleting account');
    }
    res.redirect('/');
  });
});


module.exports = router;
