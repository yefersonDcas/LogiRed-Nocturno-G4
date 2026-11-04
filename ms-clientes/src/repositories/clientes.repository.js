const pool = require('../db');
const CAMPOS_FILTRO = ["ciudad"];

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
  const [filas] = await pool.query('SELECT * FROM clientes' + where + ' ORDER BY id', valores);
  return filas;
}
async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
  return filas.length ? filas[0] : null;
}
async function create(datos) {
  const [resultado] = await pool.query(
    'INSERT INTO clientes (nombre, documento, telefono, email, ciudad) VALUES (?, ?, ?, ?, ?)',
    [datos.nombre, datos.documento, datos.telefono, datos.email, datos.ciudad]
  );
  return findById(resultado.insertId);
}
async function update(id, datos) {
  await pool.query(
    'UPDATE clientes SET nombre = ?, documento = ?, telefono = ?, email = ?, ciudad = ? WHERE id = ?',
    [datos.nombre, datos.documento, datos.telefono, datos.email, datos.ciudad, id]
  );
  // Una actualización con los mismos valores también debe devolver el registro.
  return findById(id);
}
async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}
module.exports = { findAll, findById, create, update, remove };
