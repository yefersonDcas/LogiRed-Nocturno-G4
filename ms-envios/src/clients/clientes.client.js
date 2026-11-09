const HttpError = require('../utils/http-error');

const CLIENTES_URL = process.env.CLIENTES_URL || 'http://127.0.0.1:3002';

async function existeCliente(id, autorizacion) {
  let respuesta;
  try {
    respuesta = await fetch(new URL(`/clientes/${id}`, CLIENTES_URL), {
      headers: { Authorization: autorizacion },
      redirect: 'manual',
      signal: AbortSignal.timeout(3000),
    });
    // Para validar la referencia solo hace falta el estado HTTP.
    await respuesta.body?.cancel();
  } catch {
    throw new HttpError(503, 'ms-clientes no está disponible');
  }

  if (respuesta.status === 404) return false;
  if (respuesta.status !== 200) {
    throw new HttpError(502, `ms-clientes respondió ${respuesta.status}`);
  }
  return true;
}

module.exports = { existeCliente };
