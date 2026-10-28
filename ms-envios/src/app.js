const express = require('express');
const routes = require('./routes/envios.routes');

const app = express();
app.use(express.json({ limit: '32kb' }));
app.get('/health', (req, res) => res.json({ servicio: 'ms-envios', estado: 'ok' }));
app.use('/envios', routes);
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
