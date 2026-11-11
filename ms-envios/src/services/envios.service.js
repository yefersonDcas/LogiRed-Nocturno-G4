const repo = require('../repositories/envios.repository');
const { validarEnvio, construirEnvio } = require('../models/envio');
const HttpError = require('../utils/http-error');
const { existeCliente, clientesPorIds } = require('../clients/clientes.client');

async function obtenerRegistro(id) {
  const registro = await repo.findById(id);
  if (!registro) throw new HttpError(404, `No existe el envío con id ${id}`);
  return registro;
}
async function componer(envios, autorizacion) {
  const ids = [...new Set(envios.map(envio => envio.cliente_id))];
  const clientes = await clientesPorIds(ids, autorizacion);
  if (clientes === null) {
    return envios.map(envio => ({ ...envio, cliente: null, aviso: 'ms-clientes no disponible' }));
  }
  return envios.map(envio => ({ ...envio, cliente: clientes.get(envio.cliente_id) ?? null }));
}
async function componerUno(envio, autorizacion) {
  const [compuesto] = await componer([envio], autorizacion);
  return compuesto;
}
async function listar(filtros, autorizacion) {
  return componer(await repo.findAll(filtros), autorizacion);
}
async function obtener(id, autorizacion) {
  return componerUno(await obtenerRegistro(id), autorizacion);
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
async function validarCliente(id, autorizacion) {
  if (!await existeCliente(id, autorizacion)) {
    throw new HttpError(400, `No existe el cliente con id ${id}`);
  }
}
async function crear(datos, autorizacion) {
  const limpio = preparar(datos);
  await validarCliente(limpio.cliente_id, autorizacion);
  let nuevo;
  try { nuevo = await repo.create(limpio); }
  catch (error) { traducirError(error); }
  return componerUno(nuevo, autorizacion);
}
async function actualizar(id, datos, autorizacion) {
  const actual = await obtenerRegistro(id);
  const limpio = preparar(datos);
  if (datos.estado === undefined) limpio.estado = actual.estado;
  await validarCliente(limpio.cliente_id, autorizacion);
  let actualizado;
  try { actualizado = await repo.update(id, limpio); }
  catch (error) { traducirError(error); }
  if (!actualizado) throw new HttpError(404, `No existe el envío con id ${id}`);
  return componerUno(actualizado, autorizacion);
}
async function eliminar(id) {
  if (!await repo.remove(id)) throw new HttpError(404, `No existe el envío con id ${id}`);
}
module.exports = { listar, obtener, crear, actualizar, eliminar };
