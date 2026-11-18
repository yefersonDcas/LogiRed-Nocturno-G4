// =====================================================================
// api.js · Todas las peticiones del frontend pasan por aquí.
//  - Llama al gateway (/api/...) en el MISMO dominio: app.logiredtech.co.
//    Apache reenvía /api/conductores → 127.0.0.1:3004, etc.
//  - Agrega el token JWT en la cabecera Authorization.
//  - Convierte las respuestas de error (400, 401, 403, 404, 409, 503)
//    en mensajes entendibles para el usuario.
// =====================================================================
const API = '/api';

class ErrorApi extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = Array.isArray(detalles) ? detalles : [];
  }
}

function mensajePorEstado(status, datos) {
  const delServidor = datos && datos.error;
  switch (status) {
    case 400: return delServidor || 'Los datos enviados no son válidos.';
    case 401: return 'Tu sesión no es válida o expiró. Vuelve a iniciar sesión.';
    case 403: return 'Tu rol no tiene permiso para hacer esta acción.';
    case 404: return delServidor || 'El registro no existe.';
    case 409: return delServidor || 'Ya existe un registro con esos datos.';
    case 502:
    case 503: return delServidor || 'El servicio no está disponible en este momento. Intenta más tarde.';
    default:  return delServidor || `Error inesperado del servidor (${status}).`;
  }
}

async function api(ruta, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  const token = sessionStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let respuesta;
  try {
    respuesta = await fetch(API + ruta, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el servidor.');
  }

  // 401 fuera del login = el token venció o es inválido → a iniciar sesión
  if (respuesta.status === 401 && ruta !== '/usuarios/login') {
    cerrarSesion('Tu sesión expiró. Vuelve a iniciar sesión.');
    throw new ErrorApi(401, mensajePorEstado(401));
  }

  if (respuesta.status === 204) return null; // DELETE correcto: sin cuerpo

  // Si el microservicio está apagado, Apache responde 503 en HTML, no JSON
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, mensajePorEstado(respuesta.status, datos), datos && datos.detalles);
  }
  return datos;
}
