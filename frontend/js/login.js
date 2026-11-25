// =====================================================================
// login.js · POST /api/usuarios/login → { usuario, token }
// Guarda el token y manda a cada rol a su página de inicio.
// =====================================================================
const formLogin = document.getElementById('form-login');
const cajaAviso = document.getElementById('aviso-login');
const botonEntrar = document.getElementById('btn-entrar');

// Si ya hay sesión abierta, no tiene sentido volver a pedir la clave
const yaConectado = usuarioActual();
if (yaConectado && sessionStorage.getItem('token')) {
  location.replace(PAGINA_POR_ROL[yaConectado.rol] || '/login.html');
}

// Mensaje dejado por cerrarSesion() (por ejemplo, token vencido)
const avisoPendiente = sessionStorage.getItem('aviso');
if (avisoPendiente) {
  cajaAviso.textContent = avisoPendiente;
  cajaAviso.hidden = false;
  sessionStorage.removeItem('aviso');
}

formLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const { email, password } = leerFormulario(formLogin);
  if (!email || !password) {
    cajaAviso.textContent = 'Escribe tu correo y tu contraseña.';
    cajaAviso.hidden = false;
    return;
  }

  bloquear(botonEntrar, true, 'Entrando…');
  try {
    const { usuario, token } = await api('/usuarios/login', { method: 'POST', body: { email, password } });
    iniciarSesion(usuario, token);
    location.replace(PAGINA_POR_ROL[usuario.rol] || '/login.html');
  } catch (error) {
    cajaAviso.textContent = error.status === 401
      ? 'Correo o contraseña incorrectos.'
      : error.message;
    cajaAviso.hidden = false;
    bloquear(botonEntrar, false);
  }
});
