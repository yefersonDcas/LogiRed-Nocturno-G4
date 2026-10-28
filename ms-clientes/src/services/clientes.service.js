const repo = require('../repositories/clientes.repository');
const { validarCliente, construirCliente } = require('../models/cliente');
const HttpError = require('../utils/http-error');

async function listar() { return repo.findAll(); }
async function obtener(id) {
  const cliente = await repo.findById(id);
  if (!cliente) throw new HttpError(404, `No existe el cliente con id ${id}`);
  return cliente;
}
async function crear(datos) {
  const errores = validarCliente(datos);
  if (errores.length) throw new HttpError(400, 'Datos inválidos', errores);
  try {
    return await repo.create(construirCliente(datos));
  } catch (error) {
    if (error.code === 'CLIENTE_DUPLICADO') throw new HttpError(409, error.message);
    throw error;
  }
}
module.exports = { listar, obtener, crear };
