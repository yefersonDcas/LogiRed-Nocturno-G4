// =====================================================================
// seguridad.js · Página "Mi sesión y seguridad"
//  - Muestra el token JWT decodificado (cabecera, datos, firma).
//  - Laboratorio: hace peticiones reales para provocar 200, 401 y 403.
//    Usa fetch directo (no api()) porque api() cierra la sesión al ver un
//    401, y aquí el 401 es justo lo que queremos mostrar.
// =====================================================================
const usuario = protegerPagina('seguridad');


function fecha(segundosUnix) {
  return new Date(segundosUnix * 1000).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'medium' });
}

function pintarSesion() {
  const { datos } = leerToken() || { datos: {} };
  document.getElementById('r-nombre').textContent = datos.nombre || usuario.nombre;
  document.getElementById('r-rol').textContent = NOMBRE_ROL[datos.rol] || datos.rol;
  document.getElementById('r-emitido').textContent = datos.iat ? fecha(datos.iat) : '—';
  document.getElementById('r-vence').textContent = datos.exp ? fecha(datos.exp) : '—';
  const quedan = segundosRestantes();
  document.getElementById('r-restante').textContent = formatoDuracion(quedan);
  const total = datos.exp && datos.iat ? datos.exp - datos.iat : 1;
  document.getElementById('r-barra').style.width = `${Math.max(0, Math.min(100, (quedan / total) * 100))}%`;
}

function pintarToken() {
  const info = leerToken();
  const { cabecera, datos, firma } = info.partes;
  document.getElementById('token-crudo').innerHTML =
    `<span class="p-cabecera">${escaparHtml(cabecera)}</span>.<span class="p-datos">${escaparHtml(datos)}</span>.<span class="p-firma">${escaparHtml(firma)}</span>`;

  document.getElementById('t-cabecera').textContent = JSON.stringify(info.cabecera, null, 2);
  // Explicamos iat y exp al lado de su número
  const explicado = { ...info.datos };
  const texto = JSON.stringify(explicado, null, 2)
    .replace(/("iat": )(\d+)/, `$1$2   ← emitido: ${fecha(info.datos.iat)}`)
    .replace(/("exp": )(\d+)/, `$1$2   ← vence: ${fecha(info.datos.exp)}`);
  document.getElementById('t-datos').textContent = texto;
  document.getElementById('t-firma').textContent = `${firma.slice(0, 22)}…\n\nHMAC-SHA256( cabecera + "." + datos, JWT_SECRET )`;

  document.getElementById('btn-copiar').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(info.token);
      avisar('Token copiado. Lo puedes pegar en Postman (Auth → Bearer Token).');
    } catch {
      avisar('El navegador no dejó copiar; selecciona el token a mano.', 'advertencia');
    }
  });
}

function pintarPermisos() {
  const marca = (modulo, rol) => {
    const acciones = ['ver', 'crear', 'editar', 'eliminar'].filter((a) => PERMISOS[modulo][a].includes(rol));
    if (!acciones.length) return '<span class="no">✗ sin acceso</span>';
    if (acciones.length === 4) return '<span class="si">✓ todo</span>';
    return `<span class="parcial">${acciones.join(', ')}</span>`;
  };
  document.getElementById('tabla-permisos').innerHTML = Object.keys(NOMBRE_ROL).map((rol) => `
    <tr class="${rol === usuario.rol ? 'fila-actual' : ''}">
      <td><strong>${NOMBRE_ROL[rol]}</strong>${rol === usuario.rol ? ' <span class="insignia">tú</span>' : ''}</td>
      <td>${marca('envios', rol)}</td><td>${marca('clientes', rol)}</td><td>${marca('conductores', rol)}</td>
    </tr>`).join('');
}

// ---------- Laboratorio ----------
// Qué acción prohibida probar según el rol conectado
const PROHIBIDO_POR_ROL = {
  despacho: { metodo: 'POST', ruta: '/conductores', cuerpo: {}, texto: 'Despacho intenta CREAR un conductor (solo administrador y flota pueden).' },
  flota: { metodo: 'GET', ruta: '/clientes', texto: 'Flota intenta VER los clientes (solo administrador y despacho pueden).' },
};

function prepararLaboratorio() {
  const caso = PROHIBIDO_POR_ROL[usuario.rol];
  document.getElementById('lab-prohibido-desc').textContent = caso
    ? caso.texto
    : 'El administrador tiene todos los permisos. Entra como despacho o flota para ver el 403.';

  document.querySelector('.lab').addEventListener('click', (e) => {
    const boton = e.target.closest('[data-caso]');
    if (boton) ejecutar(boton.dataset.caso);
  });
}

// Cambia el rol dentro de los datos del token pero deja la firma original
function tokenFalsificado() {
  const { partes, datos } = leerToken();
  const falsos = { ...datos, rol: 'administrador', nombre: `${datos.nombre} (falso)` };
  const bytes = new TextEncoder().encode(JSON.stringify(falsos));
  const base64url = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${partes.cabecera}.${base64url}.${partes.firma}`;
}

async function ejecutar(caso) {
  const token = sessionStorage.getItem('token');
  let peticion = { metodo: 'GET', ruta: '/conductores', token, cuerpo: undefined, nota: '' };

  if (caso === 'sin') peticion = { ...peticion, token: null, nota: 'No se envía la cabecera Authorization.' };
  if (caso === 'falso') {
    peticion = { ...peticion, token: tokenFalsificado(), nota: 'Se cambió "rol" a "administrador" en la parte 2, pero la firma (parte 3) es la original.' };
  }
  if (caso === 'prohibido') {
    const prohibido = PROHIBIDO_POR_ROL[usuario.rol];
    if (!prohibido) {
      mostrarResultado({ ...peticion, nota: 'Como administrador no hay ninguna acción prohibida. Cierra sesión y entra como despacho o flota.' }, null, null);
      return;
    }
    peticion = { ...peticion, metodo: prohibido.metodo, ruta: prohibido.ruta, cuerpo: prohibido.cuerpo, nota: 'Token válido, pero el rol no está autorizado para esta acción.' };
  }

  const headers = { Accept: 'application/json' };
  if (peticion.token) headers.Authorization = `Bearer ${peticion.token}`;
  if (peticion.cuerpo !== undefined) headers['Content-Type'] = 'application/json';

  let status = 0;
  let cuerpo;
  try {
    const respuesta = await fetch(`/api${peticion.ruta}`, {
      method: peticion.metodo,
      headers,
      body: peticion.cuerpo === undefined ? undefined : JSON.stringify(peticion.cuerpo),
    });
    status = respuesta.status;
    cuerpo = await respuesta.json().catch(() => null);
  } catch {
    cuerpo = { error: 'No hubo conexión con el servidor' };
  }
  mostrarResultado(peticion, status, cuerpo);
}

const SIGNIFICADO = {
  200: 'OK: el token es válido y el rol tiene permiso.',
  401: 'No autenticado: el servicio no sabe quién eres (sin token, token alterado o vencido).',
  403: 'Prohibido: el servicio sabe quién eres, pero tu rol no tiene permiso.',
};

function mostrarResultado(peticion, status, cuerpo) {
  const zona = document.getElementById('lab-resultado');
  zona.hidden = false;
  const autorizacion = peticion.token
    ? `Authorization: Bearer ${peticion.token.slice(0, 28)}…${peticion.token.slice(-10)}`
    : '(sin cabecera Authorization)';
  const resumenCuerpo = Array.isArray(cuerpo) ? `[ ${cuerpo.length} conductores ]` : JSON.stringify(cuerpo, null, 2);
  zona.innerHTML = `
    <div class="lab-col">
      <h3>Petición</h3>
      <pre>${escaparHtml(`${peticion.metodo} /api${peticion.ruta}\n${autorizacion}`)}</pre>
      ${peticion.nota ? `<p class="tenue">${escaparHtml(peticion.nota)}</p>` : ''}
    </div>
    <div class="lab-col">
      <h3>Respuesta</h3>
      ${status ? `<p><span class="lab-codigo grande c${status}">${status}</span> ${escaparHtml(SIGNIFICADO[status] || '')}</p>` : ''}
      ${cuerpo !== null && cuerpo !== undefined ? `<pre>${escaparHtml(resumenCuerpo)}</pre>` : ''}
    </div>`;
  zona.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Arranque (al final, cuando todas las constantes ya existen)
if (usuario) {
  pintarSesion();
  pintarToken();
  pintarPermisos();
  prepararLaboratorio();
  setInterval(pintarSesion, 1000);
}
