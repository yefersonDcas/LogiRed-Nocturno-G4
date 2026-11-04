const repo = require('../repositories/conductores.repository');
const { validarConductor, construirConductor } = require('../models/conductor');
const HttpError = require('../utils/http-error');

async function listar(filtros) { return repo.findAll(filtros); }
async function obtener(id) {
  const registro = await repo.findById(id);
  if (!registro) throw new HttpError(404, `No existe el conductor con id ${id}`);
  return registro;
}
function preparar(datos) {
  const errores = validarConductor(datos);
  if (errores.length) throw new HttpError(400, 'Datos inválidos', errores);
  return construirConductor(datos);
}
function traducirError(error) {
  if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ya existe un conductor con esa cédula');
  throw error;
}
async function crear(datos) {
  const limpio = preparar(datos);
  try { return await repo.create(limpio); }
  catch (error) { traducirError(error); }
}
async function actualizar(id, datos) {
  await obtener(id);
  const limpio = preparar(datos);
  try {
    const actualizado = await repo.update(id, limpio);
    if (!actualizado) throw new HttpError(404, `No existe el conductor con id ${id}`);
    return actualizado;
  } catch (error) { traducirError(error); }
}
async function eliminar(id) {
  if (!await repo.remove(id)) throw new HttpError(404, `No existe el conductor con id ${id}`);
}
module.exports = { listar, obtener, crear, actualizar, eliminar };
