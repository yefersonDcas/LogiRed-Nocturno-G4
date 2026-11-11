const HttpError = require('../utils/http-error');

const CLIENTES_URL = process.env.CLIENTES_URL || 'http://127.0.0.1:3002';

function pedir(ruta, autorizacion) {
  return fetch(new URL(ruta, CLIENTES_URL), {
    headers: { Authorization: autorizacion },
    redirect: 'manual',
    signal: AbortSignal.timeout(3000),
  });
}

async function existeCliente(id, autorizacion) {
  let respuesta;
  try {
    respuesta = await pedir(`/clientes/${id}`, autorizacion);
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

async function clientesPorIds(ids, autorizacion) {
  if (ids.length === 0) return new Map();

  try {
    const respuesta = await pedir(`/clientes?ids=${ids.join(',')}`, autorizacion);
    if (respuesta.status !== 200) {
      await respuesta.body?.cancel();
      return null;
    }

    const clientes = await respuesta.json();
    if (!Array.isArray(clientes)) return null;

    const porId = new Map();
    for (const cliente of clientes) {
      if (!Number.isSafeInteger(cliente?.id) || cliente.id <= 0 ||
          typeof cliente.nombre !== 'string' || typeof cliente.ciudad !== 'string') {
        return null;
      }
      const { id, nombre, ciudad } = cliente;
      porId.set(id, { id, nombre, ciudad });
    }
    return porId;
  } catch {
    return null;
  }
}

module.exports = { existeCliente, clientesPorIds };
