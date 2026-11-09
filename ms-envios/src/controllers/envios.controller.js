const service = require('../services/envios.service');
const HttpError = require('../utils/http-error');

function leerId(valor) {
  const id = Number(valor);
  if (typeof valor !== 'string' || !/^[0-9]+$/.test(valor) || !Number.isSafeInteger(id) || id <= 0) {
    throw new HttpError(400, 'El identificador debe ser un entero positivo dentro del rango seguro');
  }
  return id;
}
function leerFiltros(query) {
  const filtros = {};
  const limites = {"estado":20,"ciudad_destino":100};
  for (const [campo, maximo] of Object.entries(limites)) {
    if (query[campo] === undefined) continue;
    if (typeof query[campo] !== 'string' || !query[campo].trim() || query[campo].trim().length > maximo) {
      throw new HttpError(400, `El filtro ${campo} debe ser un texto no vacío de hasta ${maximo} caracteres`);
    }
    filtros[campo] = query[campo].trim();
  }
  if (query.cliente_id !== undefined) filtros.cliente_id = leerId(query.cliente_id);
  if (filtros.estado !== undefined && !['registrado', 'en_transito', 'entregado'].includes(filtros.estado)) {
    throw new HttpError(400, 'El filtro estado debe ser registrado, en_transito o entregado');
  }
  if (query.ids !== undefined) {
    if (typeof query.ids !== 'string' || !query.ids) {
      throw new HttpError(400, 'ids debe ser una lista de enteros positivos separados por comas');
    }
    filtros.ids = [...new Set(query.ids.split(',').map(leerId))];
  }
  return filtros;
}
async function listar(req, res) {
  res.status(200).json(await service.listar(leerFiltros(req.query)));
}
async function obtener(req, res) {
  res.status(200).json(await service.obtener(leerId(req.params.id)));
}
async function crear(req, res) {
  const nuevo = await service.crear(req.body, req.headers.authorization);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}
async function actualizar(req, res) {
  const actualizado = await service.actualizar(leerId(req.params.id), req.body, req.headers.authorization);
  res.status(200).json(actualizado);
}
async function eliminar(req, res) {
  await service.eliminar(leerId(req.params.id));
  res.status(204).end();
}
module.exports = { listar, obtener, crear, actualizar, eliminar };
