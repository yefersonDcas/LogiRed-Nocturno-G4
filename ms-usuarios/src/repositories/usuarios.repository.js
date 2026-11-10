// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================


const pool = require('../db');

function aUsuario(fila) {
  const { password_hash, ...usuario } = fila;
  return { ...usuario, activo: Boolean(fila.activo) };
}

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM usuarios';
  const condiciones = [];
  const valores = [];

  if (filtros.rol) {
    condiciones.push('rol = ?');
    valores.push(filtros.rol);
  }

  if (filtros.ids) {
    condiciones.push('id IN (?)');
    valores.push(filtros.ids);
  }

  if (condiciones.length > 0) sql += ' WHERE ' + condiciones.join(' AND ');
  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas.map(aUsuario);
}

async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  return filas.length > 0 ? aUsuario(filas[0]) : null;
}

async function findByEmail(email) {
  const [filas] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return filas.length > 0 ? aUsuario(filas[0]) : null;
}

async function findCredenciales(email) {
  const [filas] = await pool.query(
    'SELECT id, nombre, email, rol, activo, password_hash FROM usuarios WHERE email = ?', [email]);
  return filas.length > 0 ? filas[0] : null;
}

async function create(usuario, passwordHash) {
  const [resultado] = await pool.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?)',
    [usuario.nombre, usuario.email, passwordHash, usuario.rol, usuario.activo]);
  return findById(resultado.insertId);
}

async function update(id, usuario, passwordHash) {
  let sql = 'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ?';
  const valores = [usuario.nombre, usuario.email, usuario.rol, usuario.activo];
  if (passwordHash) {
    sql += ', password_hash = ?';
    valores.push(passwordHash);
  }
  const [resultado] = await pool.query(sql + ' WHERE id = ?', [...valores, id]);
  if (resultado.affectedRows === 0) return null;
  return findById(id);
}

async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

module.exports = { findAll, findById, findByEmail, findCredenciales, create, update, remove };
