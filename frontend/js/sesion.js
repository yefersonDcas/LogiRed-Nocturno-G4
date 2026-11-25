// =====================================================================
// sesion.js · Quién está conectado y qué puede hacer.
//  - El token y el usuario se guardan en sessionStorage (se borran al
//    cerrar la pestaña).
//  - PERMISOS es una copia de las reglas de los microservicios. Solo sirve
//    para ESCONDER botones: la seguridad real la hace el backend, que
//    responde 403 aunque alguien fuerce el botón.
// =====================================================================
const PAGINA_POR_ROL = {
  administrador: '/admin.html',
  despacho: '/despacho.html',
  flota: '/flota.html',
};

const TODOS = ['administrador', 'despacho', 'flota'];
const PERMISOS = {
  conductores: { ver: TODOS, crear: ['administrador', 'flota'], editar: ['administrador', 'flota'], eliminar: ['administrador', 'flota'] },
  clientes:    { ver: ['administrador', 'despacho'], crear: ['administrador', 'despacho'], editar: ['administrador', 'despacho'], eliminar: ['administrador'] },
  envios:      { ver: ['administrador', 'despacho'], crear: ['administrador', 'despacho'], editar: ['administrador', 'despacho'], eliminar: ['administrador'] },
  usuarios:    { ver: ['administrador'], crear: ['administrador'], editar: ['administrador'], eliminar: ['administrador'] },
};

const MODULOS = [
  { clave: 'envios', nombre: 'Envíos', pagina: '/envios.html', descripcion: 'Guías, destino, estado y conductor asignado.' },
  { clave: 'clientes', nombre: 'Clientes', pagina: '/clientes.html', descripcion: 'Empresas que despachan paquetes con LogiRed.' },
  { clave: 'conductores', nombre: 'Conductores', pagina: '/conductores.html', descripcion: 'Flota de Cali, Medellín y Bogotá.' },
  { clave: 'usuarios', nombre: 'Usuarios', pagina: '/usuarios.html', descripcion: 'Cuentas de acceso y su rol (ms-usuarios).' },
];

const NOMBRE_ROL = { administrador: 'Administrador', despacho: 'Despacho', flota: 'Flota' };

function usuarioActual() {
  try { return JSON.parse(sessionStorage.getItem('usuario')); } catch { return null; }
}

function iniciarSesion(usuario, token) {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('usuario', JSON.stringify(usuario));
}

function cerrarSesion(aviso) {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
  if (aviso) sessionStorage.setItem('aviso', aviso);
  location.replace('/login.html');
}

// ---------- El token por dentro ----------
// Un JWT son 3 partes separadas por puntos: CABECERA.DATOS.FIRMA
// Las dos primeras solo están codificadas en base64url (cualquiera las lee);
// la FIRMA es la que impide modificarlas sin conocer JWT_SECRET.
function decodificarParte(parte) {
  const base64 = parte.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parte.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function leerToken() {
  const token = sessionStorage.getItem('token');
  if (!token) return null;
  const [cabecera, datos, firma] = token.split('.');
  try {
    return { token, partes: { cabecera, datos, firma }, cabecera: decodificarParte(cabecera), datos: decodificarParte(datos) };
  } catch {
    return null;
  }
}

function segundosRestantes() {
  const info = leerToken();
  if (!info || !info.datos.exp) return 0;
  return Math.floor(info.datos.exp - Date.now() / 1000);
}

function formatoDuracion(segundos) {
  if (segundos <= 0) return 'vencido';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m}:${String(s).padStart(2, '0')} min`;
}

// Cierra la sesión sola cuando el token vence y avisa 5 minutos antes
function vigilarVencimiento() {
  let avisado = false;
  const revisar = () => {
    const quedan = segundosRestantes();
    const chip = document.getElementById('chip-sesion-tiempo');
    if (chip) chip.textContent = formatoDuracion(quedan);
    if (quedan <= 0) return cerrarSesion('Tu token venció: por seguridad la sesión se cerró sola.');
    if (quedan <= 300 && !avisado && typeof avisar === 'function') {
      avisado = true;
      avisar('Tu sesión vence en menos de 5 minutos.', 'advertencia');
    }
  };
  revisar();
  setInterval(revisar, 1000);
}

function puede(modulo, accion) {
  const usuario = usuarioActual();
  return Boolean(usuario && PERMISOS[modulo] && PERMISOS[modulo][accion].includes(usuario.rol));
}

// Llamar al inicio de cada página protegida.
//  modulo: 'conductores' | 'clientes' | 'envios' | null (páginas de inicio)
function protegerPagina(modulo) {
  const usuario = usuarioActual();
  if (!usuario || !leerToken()) {
    location.replace('/login.html');
    return null;
  }
  if (segundosRestantes() <= 0) {
    cerrarSesion('Tu token venció: vuelve a iniciar sesión.');
    return null;
  }
  if (modulo && PERMISOS[modulo] && !puede(modulo, 'ver')) {
    location.replace(PAGINA_POR_ROL[usuario.rol] || '/login.html');
    return null;
  }
  pintarEncabezado(usuario, modulo);
  vigilarVencimiento();
  return usuario;
}

function pintarEncabezado(usuario, moduloActual) {
  const encabezado = document.getElementById('encabezado');
  if (!encabezado) return;
  const inicio = PAGINA_POR_ROL[usuario.rol] || '/login.html';
  const enlaces = MODULOS
    .filter((m) => puede(m.clave, 'ver'))
    .map((m) => `<a href="${m.pagina}"${m.clave === moduloActual ? ' aria-current="page"' : ''}>${m.nombre}</a>`)
    .join('');
  encabezado.className = 'encabezado';
  encabezado.innerHTML = `
    <a class="marca" href="${inicio}"><span class="marca-icono" aria-hidden="true">LR</span>LogiRed</a>
    <nav class="menu">${enlaces}</nav>
    <div class="usuario">
      <a class="chip-sesion${moduloActual === 'seguridad' ? ' activo' : ''}" href="/seguridad.html" title="Tiempo de vida de tu token JWT · ver detalles">
        <span aria-hidden="true">🔐</span> Token <strong id="chip-sesion-tiempo">…</strong>
      </a>
      <span class="usuario-nombre">${escaparHtml(usuario.nombre)}</span>
      <span class="insignia rol-${usuario.rol}">${NOMBRE_ROL[usuario.rol] || usuario.rol}</span>
      <button type="button" class="btn fantasma" id="btn-salir">Salir</button>
    </div>`;
  document.getElementById('btn-salir').addEventListener('click', () => cerrarSesion());
}
