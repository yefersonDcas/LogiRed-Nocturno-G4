const service = require('../services/conductores.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const valor = req.params.id;
  const id = Number(valor);
  if (!/^[0-9]+$/.test(valor) || !Number.isSafeInteger(id) || id <= 0) {
    throw new HttpError(400, 'El id debe ser un entero positivo dentro del rango seguro');
  }
  return id;
}
async function listar(req, res) {
  res.status(200).json(await service.listar());
}
async function obtener(req, res) {
  res.status(200).json(await service.obtener(leerId(req)));
}
async function crear(req, res) {
  const nuevo = await service.crear(req.body);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}
module.exports = { listar, obtener, crear };
