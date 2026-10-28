const repo = require('../repositories/conductores.repository');
const { validarConductor, construirConductor } = require('../models/conductor');
const HttpError = require('../utils/http-error');

async function listar() { return repo.findAll(); }
async function obtener(id) {
  const conductor = await repo.findById(id);
  if (!conductor) throw new HttpError(404, `No existe el conductor con id ${id}`);
  return conductor;
}
async function crear(datos) {
  const errores = validarConductor(datos);
  if (errores.length) throw new HttpError(400, 'Datos inválidos', errores);
  try {
    return await repo.create(construirConductor(datos));
  } catch (error) {
    if (error.code === 'CONDUCTOR_DUPLICADO') throw new HttpError(409, error.message);
    throw error;
  }
}
module.exports = { listar, obtener, crear };
