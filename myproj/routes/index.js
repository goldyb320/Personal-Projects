const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.render('index', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  //makes query, fills in ? with correct attributes (defined above)
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) return res.render('index', { error: 'error' });
    if (results.length === 0) return res.render('index', { error: 'Invalid username or password' });

    const user = results[0];
    res.redirect(`/dashboard?userId=${user.userId}`);
  });
});

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', (req, res) => {
  const { username, password, firstName, lastName, address, location } = req.body;

  if (!username || !password || !firstName || !lastName || !address || !location) {
    return res.render('register', { error: 'All fields are required' });
  }

  //method for incrementing the new unique user id
  const getMaxIdQuery = 'SELECT MAX(userId) AS maxId FROM users';
  db.query(getMaxIdQuery, (err, maxResults) => {
    if (err) return res.render('register', { error: 'error' });

    const nextUserId = (maxResults[0].maxId || 0) + 1;

    const insertQuery = `
      INSERT INTO users (userId, username, password, firstName, lastName, address, location) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(insertQuery, [nextUserId, username, password, firstName, lastName, address, location], (err) => {
      if (err) return res.render('register', { error: 'couldn\'t create account' });
      res.redirect('/');
    });
  });
});

router.get('/dashboard', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.redirect('/');
  res.render('dashboard', { user: { userId }, userId });
});

router.get('/clothing', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.render('clothing', { items: [], error: 'no user' });

  const query = 'SELECT name, type, style, color FROM clothingItems WHERE userId = ?';
  db.query(query, [userId], (err, results) => {
    if (err) return res.render('clothing', { items: [], error: 'error' });
    res.render('clothing', { items: results, error: null, userId });
  });
});

router.post('/search-clothing', (req, res) => {
  const userId = req.body.userId;
  const keyword = `%${req.body.keyword}%`; //keyword that is being searched for

  const query = `
    SELECT name, type, style, color 
    FROM clothingItems 
    WHERE userId = ? AND (
      name LIKE ? OR type LIKE ? OR style LIKE ? OR color LIKE ?)`;

  //keyword search is for any attribute of the clothing item
  db.query(query, [userId, keyword, keyword, keyword, keyword], (err, results) => {
    if (err) return res.render('clothing', { items: [], error: 'error', userId });
    res.render('clothing', { items: results, error: null, userId });
  });
});


router.get('/outfits', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.render('outfits', {
      outfits: [],
      error: 'User not authenticated',
      userId: null
    });
  }

  //gets outfits
  const query = `
    SELECT o.outfitId, o.outfitStyle,
           t1.name AS top1, t2.name AS top2, b.name AS bottom
    FROM outfits o
    JOIN clothingItems t1 ON o.topLayer1 = t1.clothingId
    LEFT JOIN clothingItems t2 ON o.topLayer2 = t2.clothingId
    JOIN clothingItems b ON o.bottom = b.clothingId
    WHERE t1.userId = ? AND (t2.userId = ? OR t2.userId IS NULL) AND b.userId = ?
    ORDER BY o.outfitStyle ASC;`;

  db.query(query, [userId, userId, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.render('outfits', {
        outfits: [],
        error: 'Database error',
        userId
      });
    }

    res.render('outfits', {
      outfits: results || [],
      error: null,
      userId
    });
  });
});


router.get('/account', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.render('account', { user: null, error: 'invalid user' });

  const query = 'SELECT * FROM users WHERE userId = ?';
  db.query(query, [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.render('account', { user: null, error: 'no user' });
    }
    res.render('account', { user: results[0], error: null });
  });
});

router.post('/delete-account', (req, res) => {
  const userId = req.body.userId;

  const query = 'DELETE FROM users WHERE userId = ?';
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.send('error deleting account');
    }
    res.redirect('/');
  });
});


module.exports = router;
