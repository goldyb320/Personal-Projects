const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '34.27.202.26',
  user: 'root',       // <--- change this
  password: 'c8/@?7{H;Y2s1kd0',   // <--- change this
  database: 'UserDatabase'     // <--- change this
});

module.exports = connection;
