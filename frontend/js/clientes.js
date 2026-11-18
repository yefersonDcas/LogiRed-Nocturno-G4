// =====================================================================
// clientes.js · Pantalla de ms-clientes (puerto 3002)
//   GET    /api/clientes?ciudad=   (administrador, despacho)
//   POST   /api/clientes           (administrador, despacho)
//   PUT    /api/clientes/:id       (administrador, despacho)
//   DELETE /api/clientes/:id       (solo administrador)
// =====================================================================
const usuario = protegerPagina('clientes');

const filas = document.getElementById('filas');
const filtros = document.getElementById('filtros');
const dialogo = document.getElementById('dialogo');
const formulario = document.getElementById('formulario');
const errorForm = document.getElementById('error-form');
const botonGuardar = document.getElementById('btn-guardar');

const puedeCrear = puede('clientes', 'crear');
const puedeEditar = puede('clientes', 'editar');
const puedeEliminar = puede('clientes', 'eliminar');

let clientes = [];
let editandoId = null;

if (usuario) {
  if (puedeCrear) document.getElementById('btn-nuevo').hidden = false;
  cargar();
}

async function cargar() {
  try {
    clientes = await api(`/clientes${aQuery(leerFormulario(filtros))}`);
    pintar();
  } catch (error) {
    filas.innerHTML = `<tr><td colspan="7" class="vacio">${escaparHtml(error.message)}</td></tr>`;
  }
}

function pintar() {
  if (!clientes.length) {
    filas.innerHTML = '<tr><td colspan="7" class="vacio">No hay clientes con esos filtros.</td></tr>';
    return;
  }
  filas.innerHTML = clientes.map((c) => `
    <tr>
      <td class="tenue">${c.id}</td>
      <td><strong>${escaparHtml(c.nombre)}</strong></td>
      <td>${escaparHtml(c.documento)}</td>
      <td>${escaparHtml(c.telefono)}</td>
      <td>${escaparHtml(c.email)}</td>
      <td>${escaparHtml(c.ciudad)}</td>
      <td class="col-acciones">
        <a class="btn chico fantasma" href="/envios.html?cliente_id=${c.id}">Envíos</a>
        ${puedeEditar ? `<button class="btn chico" data-editar="${c.id}">Editar</button>` : ''}
        ${puedeEliminar ? `<button class="btn chico peligro" data-eliminar="${c.id}">Eliminar</button>` : ''}
      </td>
    </tr>`).join('');
}

filtros.addEventListener('submit', (e) => { e.preventDefault(); cargar(); });
filtros.addEventListener('reset', () => setTimeout(cargar));

document.getElementById('btn-nuevo').addEventListener('click', () => abrir(null));
document.getElementById('btn-cancelar').addEventListener('click', () => dialogo.close());

filas.addEventListener('click', (e) => {
  const editar = e.target.closest('[data-editar]');
  const eliminar = e.target.closest('[data-eliminar]');
  if (editar) abrir(clientes.find((c) => c.id === Number(editar.dataset.editar)));
  if (eliminar) borrar(Number(eliminar.dataset.eliminar));
});

function abrir(cliente) {
  formulario.reset();
  limpiarErrorFormulario(errorForm);
  editandoId = cliente ? cliente.id : null;
  document.getElementById('titulo-dialogo').textContent = cliente ? `Editar cliente #${cliente.id}` : 'Nuevo cliente';
  if (cliente) {
    for (const campo of ['nombre', 'documento', 'telefono', 'email', 'ciudad']) {
      formulario.elements[campo].value = cliente[campo];
    }
  }
  dialogo.showModal();
}

formulario.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarErrorFormulario(errorForm);
  const datos = leerFormulario(formulario);
  bloquear(botonGuardar, true);
  try {
    if (editandoId) {
      await api(`/clientes/${editandoId}`, { method: 'PUT', body: datos });
      avisar('Cliente actualizado.');
    } else {
      const nuevo = await api('/clientes', { method: 'POST', body: datos });
      avisar(`Cliente #${nuevo.id} registrado.`);
    }
    dialogo.close();
    cargar();
  } catch (error) {
    errorEnFormulario(errorForm, error);
  } finally {
    bloquear(botonGuardar, false);
  }
});

async function borrar(id) {
  const cliente = clientes.find((c) => c.id === id);
  if (!confirm(`¿Eliminar a ${cliente ? cliente.nombre : `el cliente #${id}`}? Esta acción no se puede deshacer.`)) return;
  try {
    await api(`/clientes/${id}`, { method: 'DELETE' });
    avisar('Cliente eliminado.');
    cargar();
  } catch (error) {
    mostrarError(error);
  }
}
