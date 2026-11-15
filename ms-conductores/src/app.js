const express = require('express');
const routes = require('./routes/conductores.routes');

const app = express();
app.set('json spaces', 2);
// Registro de peticiones: imprime en la terminal cada petición que llega,
// con el código que se respondió, cuánto tardó y el rol del token (si traía).
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const quien = req.usuario ? `rol=${req.usuario.rol}` : 'sin token válido';
    console.log(`${new Date().toLocaleTimeString()}  ${req.method} ${req.originalUrl} → ${res.statusCode}  (${Date.now() - inicio} ms, ${quien})`);
  });
  next();
});
app.use(express.json({ limit: '32kb' }));
app.get('/health', (req, res) => res.json({ servicio: 'ms-conductores', estado: 'ok' }));
app.use('/conductores', routes);
app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Error interno del servicio' : err.message, detalles: err.detalles });
});
module.exports = app;
