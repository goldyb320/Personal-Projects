const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.render('index', { error: null });
});

//LOGIN PAGE
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

//REGISTER PAGE
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

    const insertQuery = `INSERT INTO users (userId, username, password, firstName, lastName, address, location) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(insertQuery, [nextUserId, username, password, firstName, lastName, address, location], (err) => {
      if (err) return res.render('register', { error: 'couldn\'t create account' });
      res.redirect('/');
    });
  });
});

//displays main buttons and string containing users weather data based on location.
router.get('/dashboard', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.redirect('/');

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  //user location
  db.query('SELECT location FROM users WHERE userId = ?', [userId], (err, userResults) => {
    if (err || userResults.length === 0) {
      console.error(err);
      return res.render('dashboard', { userId, weatherInfo: null, avgTempInfo: null });
    }

    const location = userResults[0].location;

    //get daily avg to display
    db.query('SELECT dailyAvg FROM weather WHERE location = ? AND month = ? AND day = ?', [location, month, day], (err, weatherResults) => {
      if (err || weatherResults.length === 0) {
        console.error(err);
        return res.render('dashboard', { userId, weatherInfo: `Weather information unavailable for ${location}`, avgTempInfo: null });
      }

      const dailyAvg = weatherResults[0].dailyAvg;
      const weatherInfo = `The weather in ${location} is ${dailyAvg}°F`;

      //TRANSACTION #2 using sp to get the avgTemp for the month
      db.query('CALL getAvgTempForUserLocation(?, ?)', [userId, month], (err, avgTempResults) => {
        if (err) {
          console.error('Error calling getAvgTempForUserLocation:', err);
          return res.render('dashboard', { userId, weatherInfo, avgTempInfo: null });
        }

        //get avgTemp
        const avgTemp = avgTempResults[0][0] ? avgTempResults[0][0].avg_temp : null;
        const avgTempInfo = avgTemp !== null ? `The average temperature for this month in ${location} is ${avgTemp.toFixed(1)}°F.` : null;

        res.render('dashboard', { userId, weatherInfo, avgTempInfo });
      });
    });
  });
});

//TRANSACTION #1 gets the layer count in clothing
router.get('/clothing', (req, res) => {
  const userId = req.query.userId;
  const success = req.query.success;
  if (!userId) return res.render('clothing', { items: [], error: 'no user', success: null, counts: null });

  const clothingQuery = 'SELECT name, type, style, color FROM clothingItems WHERE userId = ?';

  //get item
  db.query(clothingQuery, [userId], (err, clothingResults) => {
    if (err) return res.render('clothing', { items: [], error: 'error', success: null, counts: null, userId });

    //use the procedure to get layer counts
    db.query('CALL recommendLayerCounts(?)', [userId], (err, countsResults) => {
      if (err) {
        console.error('Error calling recommendLayerCounts:', err);
        return res.render('clothing', { items: clothingResults, error: 'error loading counts', success, counts: null, userId });
      }

      //ret
      const counts = countsResults[0][0] || null;

      res.render('clothing', { items: clothingResults, error: null, success, counts, userId });
    });
  });
});



router.post('/search-clothing', (req, res) => {
  const userId = req.body.userId;
  const keyword = `%${req.body.keyword}%`; //keyword being searched for

  const searchQuery = `
    SELECT name, type, style, color 
    FROM clothingItems 
    WHERE userId = ? AND (
      name LIKE ? OR type LIKE ? OR style LIKE ? OR color LIKE ?
    )
  `;

  //do the search
  db.query(searchQuery, [userId, keyword, keyword, keyword, keyword], (err, results) => {
    if (err) {
      return res.render('clothing', { items: [], error: 'error', userId, counts: null, success: null });
    }

    //call recommendLayerCounts for counts calls TRANSACTION #1
    db.query('CALL recommendLayerCounts(?)', [userId], (err, countsResult) => {
      if (err) {
        console.error('Error calling recommendLayerCounts:', err);
        return res.render('clothing', { items: results, error: null, userId, counts: null, success: null });
      }

      const counts = countsResult[0][0] || { outer_layer_count: 0, inner_layer_count: 0, lower_layer_count: 0 };

      res.render('clothing', { items: results, error: null, userId, counts, success: null });
    });
  });
});

//adds new item of clothing 
router.post('/add-clothing', (req, res) => {
  const { userId, name, type, style, color } = req.body;

  if (!userId || !name || !type || !style || !color) {
    return res.status(400).send('Missing required fields.');
  }

  //gets the next id so user doesn't have to wrory bout it
  db.query('SELECT MAX(clothingId) AS maxId FROM clothingItems', (err, maxResults) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error.');
    }

    const nextClothingId = (maxResults[0].maxId || 0) + 1;

    //insert the new item
    const insertQuery = `
      INSERT INTO clothingItems (clothingId, name, type, style, color, userId)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    //queries
    db.query(insertQuery, [nextClothingId, name, type, style, color, userId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Failed to add clothing item.');
      }

      res.redirect(`/clothing?userId=${userId}`);
    });
  });
});

//delets a clothing item
router.post('/delete-clothing', (req, res) => {
  const { userId, name } = req.body;

  if (!userId || !name) {
    return res.status(400).send('Missing required fields.');
  }

  //takes out first clothing item with that name
  const deleteQuery = `
    DELETE FROM clothingItems
    WHERE userId = ? AND name = ?
    LIMIT 1
  `;

  db.query(deleteQuery, [userId, name], (err, result) => {
    if (err) {
      console.error('Delete clothing item error:', err);
      return res.status(500).send('Failed to delete clothing item.');
    }

    res.redirect(`/clothing?userId=${userId}&success=Clothing item deleted!`);
  });
});

router.get('/outfits', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.render('outfits', {
      outfits: [],
      error: 'User not authenticated',
      userId: null,
      popularStyle: null
    });
  }

  //get outfits per userId query, top layer 2 is optional
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
        userId,
        popularStyle: null
      });
    }

    //gets most popular outfit by style using our ctored procedure. STORED PROCEDURE #1
  db.query('CALL GetMostPopularOutfitStyle(?)', [userId], (err, procedureResults) => {
    if (err) {
      console.error(err);
      return res.render('outfits', {
        outfits: outfitsResults || [],
        error: 'Error fetching popular style',
        userId,
        popularStyle: null
      });
    }

  const popularStyle = procedureResults[0][0] ? procedureResults[0][0].outfitStyle : null;

    res.render('outfits', {
      outfits: results || [],
      error: null,
      userId,
      popularStyle
      });
    });
  });
});

//stored procedure #2 calls our recommendedOutfit procedure in gcp
router.get('/recommendation', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.redirect('/');

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  //recommened outfit
  db.query('CALL recommendOutfit(?, ?, ?)', [userId, month, day], (err, outfitResults) => {
    if (err) {
      console.error(err);
      return res.render('recommendation', { userId, recommendedOutfit: null, restaurants: [], error: 'Failed to recommend outfit.' });
    }

    //resulted
    const recommendedOutfit = outfitResults[0][0] ? outfitResults[0][0] : null;

    if (!recommendedOutfit) {
      return res.render('recommendation', { userId, recommendedOutfit: null, restaurants: [], error: 'No outfit recommendation found.' });
    }

    const location = recommendedOutfit.location;
    const outfitStyle = recommendedOutfit.outfitStyle;

    //gets top 3 restaurants by style
    const restaurantQuery = `
      SELECT name, location, phone, rate, rest_type, online_order, book_table, url
      FROM restaurants
      WHERE location = ? 
        AND rest_type LIKE ?
      ORDER BY rate DESC
      LIMIT 3
    `;

    const styleKeyword = `%${outfitStyle}%`;

    db.query(restaurantQuery, [location, styleKeyword], (err, restResults) => {
      if (err) {
        console.error(err);
        return res.render('recommendation', { userId, recommendedOutfit, restaurants: [], error: 'Failed to load restaurants.' });
      }

      res.render('recommendation', { userId, recommendedOutfit, restaurants: restResults, error: null });
    });
  });
});

router.get('/account', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.redirect('/');

  const query = 'SELECT * FROM users WHERE userId = ?';
  db.query(query, [userId], (err, results) => {
    if (err || results.length === 0) {
      console.error('Account page error:', err);
      return res.render('account', { user: null, error: 'User not found.', userId: null });
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

router.post('/update-location', (req, res) => {
  const { userId, location } = req.body;

  if (!userId || !location) {
    return res.status(400).send('Missing required fields.');
  }

  const updateQuery = 'UPDATE users SET location = ? WHERE userId = ?';

  db.query(updateQuery, [location, userId], (err, result) => {
    if (err) {
      console.error('Update location error:', err);
      return res.status(500).send('Failed to update location.');
    }
    res.redirect(`/account?userId=${userId}`);
  });
});


router.get('/restaurants', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.redirect('/');

  //get location from user
  const locationQuery = 'SELECT location FROM users WHERE userId = ?';
  db.query(locationQuery, [userId], (err, userResults) => {
    if (err || userResults.length === 0) {
      console.error(err);
      return res.render('restaurants', { restaurants: [], error: 'Failed to find user.', userId });
    }

    const userLocation = userResults[0].location;

    //now use user's location to display restaurants
    const restaurantQuery = 'SELECT name, location, phone, rate, rest_type, online_order, book_table, url FROM restaurants WHERE location = ?';
    db.query(restaurantQuery, [userLocation], (err, restResults) => {
      if (err) {
        console.error(err);
        return res.render('restaurants', { restaurants: [], error: 'Failed to find restaurants.', userId });
      }

      res.render('restaurants', { restaurants: restResults, error: null, userId });
    });
  });
});



module.exports = router;
