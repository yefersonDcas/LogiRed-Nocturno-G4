const { randomUUID } = require('node:crypto');
// Taller 1: almacenamiento en memoria; solo se guarda la referencia cliente_id.
const envios = [];
let siguienteId = 1;
const copiar = (envio) => envio ? { ...envio } : null;

async function findAll() { return envios.map(copiar); }
async function findById(id) { return copiar(envios.find((e) => e.id === id)); }
async function create(envio) {
  let guia;
  do { guia = `LR-${randomUUID().toUpperCase()}`; }
  while (envios.some((e) => e.numero_guia === guia));
  const nuevo = {
    ...envio, id: siguienteId++, numero_guia: guia,
    fecha_registro: new Date().toISOString(),
  };
  envios.push(nuevo);
  return copiar(nuevo);
}
module.exports = { findAll, findById, create };
