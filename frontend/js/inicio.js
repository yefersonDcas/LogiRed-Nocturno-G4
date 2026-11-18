// =====================================================================
// inicio.js · Páginas de inicio por rol (admin / despacho / flota).
// Cada página declara su rol en <body data-rol="...">. Si entra alguien
// de otro rol, se le manda a SU página.
// Muestra tarjetas solo de los módulos que ese rol puede ver, con el
// total de registros de cada uno.
// =====================================================================
const usuarioInicio = protegerPagina(null);

if (usuarioInicio) {
  const rolDePagina = document.body.dataset.rol;
  if (usuarioInicio.rol !== rolDePagina) {
    location.replace(PAGINA_POR_ROL[usuarioInicio.rol] || '/login.html');
  } else {
    document.getElementById('saludo').textContent = `Hola, ${usuarioInicio.nombre.split(' ')[0]} 👋`;
    pintarTarjetas();
  }
}

function pintarTarjetas() {
  const zona = document.getElementById('tarjetas');
  const visibles = MODULOS.filter((m) => puede(m.clave, 'ver'));
  zona.innerHTML = visibles.map((m) => `
    <a class="tarjeta-modulo" href="${m.pagina}">
      <span class="tarjeta-total" id="total-${m.clave}">…</span>
      <h2>${m.nombre}</h2>
      <p>${m.descripcion}</p>
      <span class="tarjeta-accion">${puede(m.clave, 'crear') ? 'Consultar y gestionar' : 'Solo consulta'} →</span>
    </a>`).join('') + `
    <a class="tarjeta-modulo seguridad" href="/seguridad.html">
      <span class="tarjeta-total">🔐 ${formatoDuracion(segundosRestantes())}</span>
      <h2>Mi sesión y seguridad</h2>
      <p>Tu token JWT por dentro y pruebas en vivo de 401 y 403.</p>
      <span class="tarjeta-accion">Ver mi token →</span>
    </a>`;

  for (const m of visibles) {
    api(`/${m.clave}`)
      .then((lista) => { document.getElementById(`total-${m.clave}`).textContent = lista.length; })
      .catch(() => {
        const total = document.getElementById(`total-${m.clave}`);
        total.textContent = 'sin conexión';
        total.classList.add('caido');
      });
  }
}
