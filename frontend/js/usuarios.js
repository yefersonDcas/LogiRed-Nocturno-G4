// =====================================================================
// usuarios.js · Pantalla de ms-usuarios (puerto 3001) · solo administrador
//   GET    /api/usuarios?rol=     POST /api/usuarios
//   PUT    /api/usuarios/:id      DELETE /api/usuarios/:id
// La contraseña es obligatoria al crear y opcional al editar (si se deja
// vacía, no se envía y ms-usuarios conserva la anterior).
// =====================================================================
const usuario = protegerPagina('usuarios');

const filas = document.getElementById('filas');
const filtros = document.getElementById('filtros');
const dialogo = document.getElementById('dialogo');
const formulario = document.getElementById('formulario');
const errorForm = document.getElementById('error-form');
const botonGuardar = document.getElementById('btn-guardar');

let usuarios = [];
let editandoId = null;

if (usuario) {
  document.getElementById('btn-nuevo').hidden = false;
  cargar();
}

async function cargar() {
  try {
    usuarios = await api(`/usuarios${aQuery(leerFormulario(filtros))}`);
    pintar();
  } catch (error) {
    filas.innerHTML = `<tr><td colspan="6" class="vacio">${escaparHtml(error.message)}</td></tr>`;
  }
}

function pintar() {
  if (!usuarios.length) {
    filas.innerHTML = '<tr><td colspan="6" class="vacio">No hay usuarios con ese filtro.</td></tr>';
    return;
  }
  filas.innerHTML = usuarios.map((u) => `
    <tr>
      <td class="tenue">${u.id}</td>
      <td><strong>${escaparHtml(u.nombre)}</strong>${u.id === usuario.id ? ' <span class="insignia">tú</span>' : ''}</td>
      <td>${escaparHtml(u.email)}</td>
      <td>${escaparHtml(NOMBRE_ROL[u.rol] || u.rol)}</td>
      <td>${u.activo ? '<span class="insignia estado-entregado">Activo</span>' : '<span class="insignia gris">Inactivo</span>'}</td>
      <td class="col-acciones">
        <button class="btn chico" data-editar="${u.id}">Editar</button>
        ${u.id === usuario.id ? '' : `<button class="btn chico peligro" data-eliminar="${u.id}">Eliminar</button>`}
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
  if (editar) abrir(usuarios.find((u) => u.id === Number(editar.dataset.editar)));
  if (eliminar) borrar(Number(eliminar.dataset.eliminar));
});

function abrir(u) {
  formulario.reset();
  limpiarErrorFormulario(errorForm);
  editandoId = u ? u.id : null;
  document.getElementById('titulo-dialogo').textContent = u ? `Editar usuario #${u.id}` : 'Nuevo usuario';
  document.getElementById('etiqueta-clave').textContent = u ? 'Nueva contraseña (déjala vacía para no cambiarla)' : 'Contraseña';
  if (u) {
    formulario.elements.nombre.value = u.nombre;
    formulario.elements.email.value = u.email;
    formulario.elements.rol.value = u.rol;
    formulario.elements.activo.value = String(u.activo !== false);
  }
  dialogo.showModal();
}

formulario.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarErrorFormulario(errorForm);
  const f = leerFormulario(formulario);
  const datos = { nombre: f.nombre, email: f.email, rol: f.rol, activo: f.activo === 'true' };
  if (f.password) datos.password = f.password; // al editar, vacío = no cambiar
  bloquear(botonGuardar, true);
  try {
    if (editandoId) {
      await api(`/usuarios/${editandoId}`, { method: 'PUT', body: datos });
      avisar('Usuario actualizado.');
    } else {
      const nuevo = await api('/usuarios', { method: 'POST', body: datos });
      avisar(`Usuario #${nuevo.id} creado. Ya puede iniciar sesión.`);
    }
    dialogo.close();
    cargar();
  } catch (error) {
    errorEnFormulario(errorForm, error); // 400 validación, 409 correo repetido
  } finally {
    bloquear(botonGuardar, false);
  }
});

async function borrar(id) {
  const u = usuarios.find((x) => x.id === id);
  if (!confirm(`¿Eliminar la cuenta de ${u ? u.nombre : `#${id}`}? Ya no podrá iniciar sesión.`)) return;
  try {
    await api(`/usuarios/${id}`, { method: 'DELETE' });
    avisar('Usuario eliminado.');
    cargar();
  } catch (error) {
    mostrarError(error);
  }
}
