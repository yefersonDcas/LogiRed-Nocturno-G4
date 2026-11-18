// =====================================================================
// conductores.js · Pantalla de ms-conductores (puerto 3004)
//   GET    /api/conductores?sede=&categoria_licencia=   (todos los roles)
//   POST   /api/conductores                             (administrador, flota)
//   PUT    /api/conductores/:id                         (administrador, flota)
//   DELETE /api/conductores/:id                         (administrador, flota)
// =====================================================================
const usuario = protegerPagina('conductores');

const filas = document.getElementById('filas');
const filtros = document.getElementById('filtros');
const dialogo = document.getElementById('dialogo');
const formulario = document.getElementById('formulario');
const errorForm = document.getElementById('error-form');
const botonGuardar = document.getElementById('btn-guardar');

const puedeCrear = puede('conductores', 'crear');
const puedeEditar = puede('conductores', 'editar');
const puedeEliminar = puede('conductores', 'eliminar');

let conductores = [];
let editandoId = null; // null = creando, número = editando

if (usuario) {
  if (puedeCrear) document.getElementById('btn-nuevo').hidden = false;
  else document.getElementById('subtitulo').textContent += ' Tu rol solo puede consultar.';
  cargar();
}

async function cargar() {
  try {
    conductores = await api(`/conductores${aQuery(leerFormulario(filtros))}`);
    pintar();
  } catch (error) {
    filas.innerHTML = `<tr><td colspan="7" class="vacio">${escaparHtml(error.message)}</td></tr>`;
  }
}

function pintar() {
  if (!conductores.length) {
    filas.innerHTML = '<tr><td colspan="7" class="vacio">No hay conductores con esos filtros.</td></tr>';
    return;
  }
  filas.innerHTML = conductores.map((c) => `
    <tr>
      <td class="tenue">${c.id}</td>
      <td><strong>${escaparHtml(c.nombre)}</strong></td>
      <td>${escaparHtml(c.cedula)}</td>
      <td><span class="insignia">${escaparHtml(c.categoria_licencia)}</span></td>
      <td>${escaparHtml(c.telefono)}</td>
      <td>${escaparHtml(c.sede)}</td>
      <td class="col-acciones">
        ${puedeEditar ? `<button class="btn chico" data-editar="${c.id}">Editar</button>` : ''}
        ${puedeEliminar ? `<button class="btn chico peligro" data-eliminar="${c.id}">Eliminar</button>` : ''}
      </td>
    </tr>`).join('');
}

// ---- Filtros ----
filtros.addEventListener('submit', (e) => { e.preventDefault(); cargar(); });
filtros.addEventListener('reset', () => setTimeout(cargar));

// ---- Abrir el formulario ----
document.getElementById('btn-nuevo').addEventListener('click', () => abrir(null));
document.getElementById('btn-cancelar').addEventListener('click', () => dialogo.close());

filas.addEventListener('click', (e) => {
  const editar = e.target.closest('[data-editar]');
  const eliminar = e.target.closest('[data-eliminar]');
  if (editar) abrir(conductores.find((c) => c.id === Number(editar.dataset.editar)));
  if (eliminar) borrar(Number(eliminar.dataset.eliminar));
});

function abrir(conductor) {
  formulario.reset();
  limpiarErrorFormulario(errorForm);
  editandoId = conductor ? conductor.id : null;
  document.getElementById('titulo-dialogo').textContent = conductor ? `Editar conductor #${conductor.id}` : 'Nuevo conductor';
  if (conductor) {
    for (const campo of ['nombre', 'cedula', 'telefono', 'categoria_licencia', 'sede']) {
      formulario.elements[campo].value = conductor[campo];
    }
  }
  dialogo.showModal();
}

// ---- Guardar (POST o PUT) ----
formulario.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarErrorFormulario(errorForm);
  const datos = leerFormulario(formulario);
  bloquear(botonGuardar, true);
  try {
    if (editandoId) {
      await api(`/conductores/${editandoId}`, { method: 'PUT', body: datos });
      avisar('Conductor actualizado.');
    } else {
      const nuevo = await api('/conductores', { method: 'POST', body: datos });
      avisar(`Conductor #${nuevo.id} registrado.`);
    }
    dialogo.close();
    cargar();
  } catch (error) {
    errorEnFormulario(errorForm, error); // 400 con detalles, 409 cédula repetida, 403…
  } finally {
    bloquear(botonGuardar, false);
  }
});

// ---- Eliminar ----
async function borrar(id) {
  const conductor = conductores.find((c) => c.id === id);
  if (!confirm(`¿Eliminar a ${conductor ? conductor.nombre : `el conductor #${id}`}? Esta acción no se puede deshacer.`)) return;
  try {
    await api(`/conductores/${id}`, { method: 'DELETE' });
    avisar('Conductor eliminado.');
    cargar();
  } catch (error) {
    mostrarError(error);
  }
}
