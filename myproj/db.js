const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '34.27.202.26',
  user: 'root',      
  password: 'c8/@?7{H;Y2s1kd0',  
  database: 'UserDatabase'
});

module.exports = connection;
