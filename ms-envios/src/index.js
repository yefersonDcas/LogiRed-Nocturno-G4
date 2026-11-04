const app = require('./app');
const pool = require('./db');
const PORT = Number(process.env.PORT) || 3003;
const HOST = process.env.HOST || '127.0.0.1';

async function iniciar() {
  try {
    await pool.query('SELECT 1');
    app.listen(PORT, HOST, () => console.log(`ms-envios escuchando en http://${HOST}:${PORT}`));
  } catch (error) {
    console.error('No se pudo conectar a la base de datos. Revise DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD.', error.code);
    await pool.end();
    process.exitCode = 1;
  }
}
iniciar();
