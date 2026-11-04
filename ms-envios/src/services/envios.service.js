const repo = require('../repositories/envios.repository');
const { validarEnvio, construirEnvio } = require('../models/envio');
const HttpError = require('../utils/http-error');

async function listar(filtros) { return repo.findAll(filtros); }
async function obtener(id) {
  const registro = await repo.findById(id);
  if (!registro) throw new HttpError(404, `No existe el envío con id ${id}`);
  return registro;
}
function preparar(datos) {
  const errores = validarEnvio(datos);
  if (errores.length) throw new HttpError(400, 'Datos inválidos', errores);
  return construirEnvio(datos);
}
function traducirError(error) {
  if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ya existe un envío con ese número de guía');
  throw error;
}
async function crear(datos) {
  const limpio = preparar(datos);
  try { return await repo.create(limpio); }
  catch (error) { traducirError(error); }
}
async function actualizar(id, datos) {
  const actual = await obtener(id);
  const limpio = preparar(datos);
  if (datos.estado === undefined) limpio.estado = actual.estado;
  try {
    const actualizado = await repo.update(id, limpio);
    if (!actualizado) throw new HttpError(404, `No existe el envío con id ${id}`);
    return actualizado;
  } catch (error) { traducirError(error); }
}
async function eliminar(id) {
  if (!await repo.remove(id)) throw new HttpError(404, `No existe el envío con id ${id}`);
}
module.exports = { listar, obtener, crear, actualizar, eliminar };
