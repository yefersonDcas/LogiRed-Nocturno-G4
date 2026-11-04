const service = require('../services/conductores.service');
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
  const limites = {"sede":20,"categoria_licencia":2};
  for (const [campo, maximo] of Object.entries(limites)) {
    if (query[campo] === undefined) continue;
    if (typeof query[campo] !== 'string' || !query[campo].trim() || query[campo].trim().length > maximo) {
      throw new HttpError(400, `El filtro ${campo} debe ser un texto no vacío de hasta ${maximo} caracteres`);
    }
    filtros[campo] = query[campo].trim();
  }
  if (filtros.categoria_licencia !== undefined) {
    filtros.categoria_licencia = filtros.categoria_licencia.toUpperCase();
    if (!['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'].includes(filtros.categoria_licencia)) {
      throw new HttpError(400, 'El filtro categoria_licencia no corresponde al catálogo');
    }
  }
  if (filtros.sede !== undefined) {
    const clave = filtros.sede.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const sedes = { cali: 'Cali', medellin: 'Medellín', bogota: 'Bogotá' };
    if (!Object.hasOwn(sedes, clave)) throw new HttpError(400, 'El filtro sede debe ser Cali, Medellín o Bogotá');
    filtros.sede = sedes[clave];
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
  const nuevo = await service.crear(req.body);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}
async function actualizar(req, res) {
  res.status(200).json(await service.actualizar(leerId(req.params.id), req.body));
}
async function eliminar(req, res) {
  await service.eliminar(leerId(req.params.id));
  res.status(204).end();
}
module.exports = { listar, obtener, crear, actualizar, eliminar };
