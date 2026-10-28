// Campos y validaciones de la entidad Conductor.
const CAMPOS = new Set(['nombre', 'cedula', 'categoria_licencia', 'telefono', 'sede']);
const CATEGORIAS = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
const SEDES = ['Cali', 'Medellín', 'Bogotá'];

function claveSede(valor) {
  return valor.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function validarConductor(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return ['Se esperaba un objeto JSON con los datos del conductor'];
  }
  const errores = [];
  for (const campo of Object.keys(datos)) {
    if (!CAMPOS.has(campo)) errores.push(`Campo no permitido: ${campo}`);
  }
  for (const [campo, maximo] of Object.entries({ nombre: 150, cedula: 20, categoria_licencia: 2, telefono: 32, sede: 20 })) {
    if (typeof datos[campo] !== 'string' || !datos[campo].trim()) {
      errores.push(`${campo} es obligatorio y debe ser un texto no vacío`);
    } else if (datos[campo].trim().length > maximo) {
      errores.push(`${campo} no debe superar ${maximo} caracteres`);
    }
  }
  if (typeof datos.cedula === 'string' &&
      (!/^[0-9]+$/.test(datos.cedula.trim()) || /^0+$/.test(datos.cedula.trim()))) {
    errores.push('cedula debe contener dígitos y no puede estar formada solo por ceros');
  }
  if (typeof datos.categoria_licencia === 'string' && !CATEGORIAS.includes(datos.categoria_licencia.trim().toUpperCase())) {
    errores.push(`categoria_licencia debe ser una de: ${CATEGORIAS.join(', ')}`);
  }
  if (typeof datos.telefono === 'string') {
    const telefono = datos.telefono.trim();
    const cantidad = telefono.replace(/\D/g, '').length;
    if (!/^\+?[0-9 ()-]+$/.test(telefono) || cantidad < 7 || cantidad > 15) {
      errores.push('telefono debe contener entre 7 y 15 dígitos; admite + inicial, espacios, paréntesis y guiones');
    }
  }
  if (typeof datos.sede === 'string' && !SEDES.some((sede) => claveSede(sede) === claveSede(datos.sede))) {
    errores.push(`sede debe ser una de: ${SEDES.join(', ')}`);
  }
  return errores;
}
function construirConductor(datos) {
  return {
    nombre: datos.nombre.trim(),
    cedula: datos.cedula.trim(),
    categoria_licencia: datos.categoria_licencia.trim().toUpperCase(),
    telefono: datos.telefono.trim().replace(/[ ()-]/g, ''),
    sede: SEDES.find((sede) => claveSede(sede) === claveSede(datos.sede)),
  };
}
module.exports = { validarConductor, construirConductor };
