const { randomUUID } = require('node:crypto');
const pool = require('../db');
const CAMPOS_FILTRO = ["estado","cliente_id","ciudad_destino"];

function aEnvio(fila) {
  return { ...fila, fecha_registro: new Date(fila.fecha_registro.replace(' ', 'T') + 'Z').toISOString() };
}

async function findAll(filtros = {}) {
  const condiciones = [];
  const valores = [];
  for (const campo of CAMPOS_FILTRO) {
    if (filtros[campo] !== undefined) {
      condiciones.push(campo + ' = ?');
      valores.push(filtros[campo]);
    }
  }
  if (filtros.ids !== undefined) {
    if (!filtros.ids.length) return [];
    condiciones.push('id IN (?)');
    valores.push(filtros.ids);
  }
  const where = condiciones.length ? ' WHERE ' + condiciones.join(' AND ') : '';
  const [filas] = await pool.query('SELECT * FROM envios' + where + ' ORDER BY id', valores);
  return filas.map(aEnvio);
}
async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM envios WHERE id = ?', [id]);
  return filas.length ? aEnvio(filas[0]) : null;
}
async function create(datos) {
  const [resultado] = await pool.query(
    'INSERT INTO envios (numero_guia, cliente_id, peso_kg, ciudad_destino, direccion_destino, estado, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [`LR-${randomUUID().toUpperCase()}`, datos.cliente_id, datos.peso_kg, datos.ciudad_destino, datos.direccion_destino, datos.estado, new Date().toISOString().slice(0, 23).replace('T', ' ')]
  );
  return findById(resultado.insertId);
}
async function update(id, datos) {
  await pool.query(
    'UPDATE envios SET cliente_id = ?, peso_kg = ?, ciudad_destino = ?, direccion_destino = ?, estado = ? WHERE id = ?',
    [datos.cliente_id, datos.peso_kg, datos.ciudad_destino, datos.direccion_destino, datos.estado, id]
  );
  // Una actualización con los mismos valores también debe devolver el registro.
  return findById(id);
}
async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM envios WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}
module.exports = { findAll, findById, create, update, remove };
