// =====================================================================
// envios.js · Pantalla de ms-envios (puerto 3003)
//   GET    /api/envios?estado=&ciudad_destino=&cliente_id=&conductor_id=
//   POST   /api/envios          PUT /api/envios/:id      (administrador, despacho)
//   DELETE /api/envios/:id      (solo administrador)
//
// RELACIONES: el frontend NO junta los datos. ms-envios ya devuelve cada
// envío con { cliente: {...}, conductor: {...} } porque él mismo consulta
// a ms-clientes y a ms-conductores por REST. Si alguno está caído, el
// envío llega con un aviso y aquí se muestra en amarillo.
// Las listas de clientes y conductores solo se piden para llenar los
// desplegables del formulario.
// =====================================================================
const usuario = protegerPagina('envios');

const filas = document.getElementById('filas');
const filtros = document.getElementById('filtros');
const dialogo = document.getElementById('dialogo');
const formulario = document.getElementById('formulario');
const errorForm = document.getElementById('error-form');
const botonGuardar = document.getElementById('btn-guardar');
const banner = document.getElementById('banner-aviso');

const puedeCrear = puede('envios', 'crear');
const puedeEditar = puede('envios', 'editar');
const puedeEliminar = puede('envios', 'eliminar');

const ESTADOS = { registrado: 'Registrado', en_transito: 'En tránsito', entregado: 'Entregado' };

let envios = [];
let editandoId = null;

if (usuario) {
  if (puedeCrear) document.getElementById('btn-nuevo').hidden = false;
  // Permite llegar filtrado desde Clientes: envios.html?cliente_id=3
  const desdeUrl = new URLSearchParams(location.search);
  cargarListas().then(() => {
    for (const campo of ['cliente_id', 'conductor_id', 'estado']) {
      if (desdeUrl.get(campo)) filtros.elements[campo].value = desdeUrl.get(campo);
    }
    cargar();
  });
}

// Llena los <select> de clientes y conductores (filtros y formulario)
async function cargarListas() {
  const [clientes, conductores] = await Promise.allSettled([api('/clientes'), api('/conductores')]);
  llenar('.lista-clientes', clientes, (c) => `${c.nombre} · ${c.ciudad}`, 'ms-clientes');
  llenar('.lista-conductores', conductores, (c) => `${c.nombre} · ${c.sede} · ${c.categoria_licencia}`, 'ms-conductores');
}

function llenar(selector, resultado, texto, servicio) {
  for (const select of document.querySelectorAll(selector)) {
    const primera = select.options[0].outerHTML; // "Todos" / "Elige…" / "Sin asignar"
    if (resultado.status === 'fulfilled') {
      select.innerHTML = primera + resultado.value
        .map((x) => `<option value="${x.id}">${escaparHtml(texto(x))}</option>`).join('');
    } else {
      select.innerHTML = primera;
      select.title = `${servicio} no respondió: ${resultado.reason.message}`;
    }
  }
  if (resultado.status === 'rejected') {
    avisar(`No se pudo cargar la lista de ${servicio}.`, 'advertencia', [resultado.reason.message]);
  }
}

async function cargar() {
  try {
    envios = await api(`/envios${aQuery(leerFormulario(filtros))}`);
    pintar();
  } catch (error) {
    filas.innerHTML = `<tr><td colspan="8" class="vacio">${escaparHtml(error.message)}</td></tr>`;
  }
}

function celdaCliente(e) {
  if (e.cliente) return `<strong>${escaparHtml(e.cliente.nombre)}</strong><br><span class="tenue">${escaparHtml(e.cliente.ciudad)}</span>`;
  return `<span class="tenue">Cliente #${e.cliente_id}</span>`;
}

function celdaConductor(e) {
  if (e.conductor) return `${escaparHtml(e.conductor.nombre)}<br><span class="tenue">${escaparHtml(e.conductor.telefono)}</span>`;
  if (e.conductor_id) return `<span class="tenue">Conductor #${e.conductor_id}</span>`;
  return '<span class="insignia gris">Sin asignar</span>';
}

function pintar() {
  // Avisos de composición: un servicio relacionado no respondió
  const avisos = [...new Set(envios.flatMap((e) => [e.aviso, e.aviso_conductor].filter(Boolean)))];
  banner.hidden = !avisos.length;
  banner.innerHTML = avisos.length
    ? `<strong>Algunos datos no se pudieron completar:</strong> ${avisos.map(escaparHtml).join(' · ')}` : '';

  if (!envios.length) {
    filas.innerHTML = '<tr><td colspan="8" class="vacio">No hay envíos con esos filtros.</td></tr>';
    return;
  }
  filas.innerHTML = envios.map((e) => `
    <tr>
      <td><code title="${escaparHtml(e.numero_guia)}">${escaparHtml(String(e.numero_guia).slice(0, 11))}…</code><br><span class="tenue">#${e.id}</span></td>
      <td>${celdaCliente(e)}</td>
      <td>${escaparHtml(e.ciudad_destino)}<br><span class="tenue">${escaparHtml(e.direccion_destino)}</span></td>
      <td>${Number(e.peso_kg).toLocaleString('es-CO')} kg</td>
      <td>${celdaConductor(e)}</td>
      <td><span class="insignia estado-${e.estado}">${ESTADOS[e.estado] || escaparHtml(e.estado)}</span></td>
      <td class="tenue">${fechaCorta(e.fecha_registro)}</td>
      <td class="col-acciones">
        ${puedeEditar ? `<button class="btn chico" data-editar="${e.id}">Editar</button>` : ''}
        ${puedeEliminar ? `<button class="btn chico peligro" data-eliminar="${e.id}">Eliminar</button>` : ''}
      </td>
    </tr>`).join('');
}

filtros.addEventListener('submit', (e) => { e.preventDefault(); cargar(); });
filtros.addEventListener('reset', () => setTimeout(cargar));

document.getElementById('btn-nuevo').addEventListener('click', () => abrir(null));
document.getElementById('btn-cancelar').addEventListener('click', () => dialogo.close());

filas.addEventListener('click', (ev) => {
  const editar = ev.target.closest('[data-editar]');
  const eliminar = ev.target.closest('[data-eliminar]');
  if (editar) abrir(envios.find((x) => x.id === Number(editar.dataset.editar)));
  if (eliminar) borrar(Number(eliminar.dataset.eliminar));
});

function abrir(envio) {
  formulario.reset();
  limpiarErrorFormulario(errorForm);
  editandoId = envio ? envio.id : null;
  document.getElementById('titulo-dialogo').textContent = envio ? `Editar envío #${envio.id}` : 'Nuevo envío';
  if (envio) {
    asegurarOpcion(formulario.elements.cliente_id, envio.cliente_id, `Cliente #${envio.cliente_id}`);
    asegurarOpcion(formulario.elements.conductor_id, envio.conductor_id, `Conductor #${envio.conductor_id}`);
    for (const campo of ['cliente_id', 'ciudad_destino', 'direccion_destino', 'peso_kg', 'estado']) {
      formulario.elements[campo].value = envio[campo];
    }
    formulario.elements.conductor_id.value = envio.conductor_id ?? '';
  }
  dialogo.showModal();
}

// Si la lista no cargó (servicio caído), igual se puede editar el envío
function asegurarOpcion(select, id, texto) {
  if (id && ![...select.options].some((o) => o.value === String(id))) {
    select.insertAdjacentHTML('beforeend', `<option value="${id}">${escaparHtml(texto)}</option>`);
  }
}

formulario.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  limpiarErrorFormulario(errorForm);
  const f = leerFormulario(formulario);
  // ms-envios exige números, no textos: cliente_id 1, no "1"
  const datos = {
    cliente_id: f.cliente_id ? Number(f.cliente_id) : null,
    conductor_id: f.conductor_id ? Number(f.conductor_id) : null,
    peso_kg: f.peso_kg === '' ? null : Number(f.peso_kg),
    ciudad_destino: f.ciudad_destino,
    direccion_destino: f.direccion_destino,
    estado: f.estado,
  };
  bloquear(botonGuardar, true);
  try {
    if (editandoId) {
      await api(`/envios/${editandoId}`, { method: 'PUT', body: datos });
      avisar('Envío actualizado.');
    } else {
      const nuevo = await api('/envios', { method: 'POST', body: datos });
      avisar(`Envío #${nuevo.id} registrado.`);
    }
    dialogo.close();
    cargar();
  } catch (error) {
    // 400 = cliente o conductor no existe / datos inválidos; 503 = un servicio relacionado está caído
    errorEnFormulario(errorForm, error);
  } finally {
    bloquear(botonGuardar, false);
  }
});

async function borrar(id) {
  if (!confirm(`¿Eliminar el envío #${id}? Esta acción no se puede deshacer.`)) return;
  try {
    await api(`/envios/${id}`, { method: 'DELETE' });
    avisar('Envío eliminado.');
    cargar();
  } catch (error) {
    mostrarError(error);
  }
}
