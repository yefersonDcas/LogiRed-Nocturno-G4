const app = require('./app');
const PORT = Number(process.env.PORT) || 3004;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => console.log(`ms-conductores escuchando en http://${HOST}:${PORT}`));
