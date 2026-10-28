// Cliente comercial de LogiRed; no contiene cuentas ni roles.
const CAMPOS = new Set(['nombre', 'documento', 'telefono', 'email', 'ciudad']);
function validarCliente(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return ['Se esperaba un objeto JSON con los datos del cliente'];
  const errores = [];
  for (const campo of Object.keys(datos)) {
    if (!CAMPOS.has(campo)) errores.push(`Campo no permitido: ${campo}`);
  }
  for (const [campo, maximo] of Object.entries({ nombre: 150, documento: 30, telefono: 32, email: 254, ciudad: 100 })) {
    if (typeof datos[campo] !== 'string' || !datos[campo].trim()) errores.push(`${campo} es obligatorio y debe ser un texto no vacío`);
    else if (datos[campo].trim().length > maximo) errores.push(`${campo} no debe superar ${maximo} caracteres`);
  }
  if (typeof datos.documento === 'string' && !/^[A-Z0-9-]+$/i.test(datos.documento.trim())) errores.push('documento solo admite letras, números y guiones');
  if (typeof datos.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) errores.push('email debe tener un formato válido');
  if (typeof datos.telefono === 'string') {
    const telefono = datos.telefono.trim();
    const cantidad = telefono.replace(/\D/g, '').length;
    if (!/^\+?[0-9 ()-]+$/.test(telefono) || cantidad < 7 || cantidad > 15) errores.push('telefono debe contener entre 7 y 15 dígitos; admite + inicial, espacios, paréntesis y guiones');
  }
  return errores;
}
function construirCliente(datos) {
  return {
    nombre: datos.nombre.trim(), documento: datos.documento.trim().toUpperCase(),
    telefono: datos.telefono.trim().replace(/[ ()-]/g, ''),
    email: datos.email.trim().toLowerCase(), ciudad: datos.ciudad.trim(),
  };
}
module.exports = { validarCliente, construirCliente };
