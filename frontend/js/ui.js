// =====================================================================
// ui.js · Utilidades de pantalla compartidas por todas las páginas.
// =====================================================================

// Evita que un texto guardado en la base (p. ej. "<script>") se ejecute
// al pintarlo en la tabla: protección contra XSS.
function escaparHtml(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Mensajes flotantes (abajo a la derecha)
function avisar(mensaje, tipo = 'exito', detalles = []) {
  let zona = document.getElementById('avisos');
  if (!zona) {
    zona = document.createElement('div');
    zona.id = 'avisos';
    document.body.appendChild(zona);
  }
  const aviso = document.createElement('div');
  aviso.className = `aviso aviso-${tipo}`;
  aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  aviso.innerHTML = `<strong>${escaparHtml(mensaje)}</strong>` +
    (detalles.length ? `<ul>${detalles.map((d) => `<li>${escaparHtml(d)}</li>`).join('')}</ul>` : '');
  zona.appendChild(aviso);
  setTimeout(() => aviso.remove(), detalles.length ? 9000 : 5000);
}

function mostrarError(error) {
  avisar(error.message || 'Ocurrió un error.', 'error', error.detalles || []);
}

// Muestra los errores de validación (400) dentro del formulario abierto
function errorEnFormulario(contenedor, error) {
  contenedor.hidden = false;
  contenedor.innerHTML = `<strong>${escaparHtml(error.message)}</strong>` +
    (error.detalles && error.detalles.length
      ? `<ul>${error.detalles.map((d) => `<li>${escaparHtml(d)}</li>`).join('')}</ul>` : '');
}

function limpiarErrorFormulario(contenedor) {
  contenedor.hidden = true;
  contenedor.innerHTML = '';
}

// Lee un formulario como objeto, quitando espacios a los textos
function leerFormulario(form) {
  const datos = {};
  for (const [campo, valor] of new FormData(form).entries()) {
    datos[campo] = typeof valor === 'string' ? valor.trim() : valor;
  }
  return datos;
}

// Construye ?campo=valor solo con los filtros llenos
function aQuery(filtros) {
  const params = new URLSearchParams();
  for (const [campo, valor] of Object.entries(filtros)) if (valor) params.set(campo, valor);
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

function bloquear(boton, ocupado, textoOcupado = 'Guardando…') {
  if (ocupado) {
    boton.dataset.texto = boton.textContent;
    boton.textContent = textoOcupado;
    boton.disabled = true;
  } else {
    boton.textContent = boton.dataset.texto || boton.textContent;
    boton.disabled = false;
  }
}

function fechaCorta(iso) {
  if (!iso) return '';
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? iso
    : fecha.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}
