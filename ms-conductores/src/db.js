const mysql = require('mysql2/promise');

// Cada servicio se conecta únicamente a su propia base.
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'conductores_db',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  charset: 'utf8mb4',
  dateStrings: true,
  decimalNumbers: true,
  connectTimeout: 5000,
  enableKeepAlive: true,
});
module.exports = pool;
