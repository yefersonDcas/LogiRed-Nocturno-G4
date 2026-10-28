const repo = require('../repositories/envios.repository');
const { validarEnvio, construirEnvio } = require('../models/envio');
const HttpError = require('../utils/http-error');

async function listar() { return repo.findAll(); }
async function obtener(id) {
  const envio = await repo.findById(id);
  if (!envio) throw new HttpError(404, `No existe el envío con id ${id}`);
  return envio;
}
async function crear(datos) {
  const errores = validarEnvio(datos);
  if (errores.length) throw new HttpError(400, 'Datos inválidos', errores);
  // Taller 1: se valida el formato de cliente_id sin consultar otros servicios.
  return repo.create(construirEnvio(datos));
}
module.exports = { listar, obtener, crear };
