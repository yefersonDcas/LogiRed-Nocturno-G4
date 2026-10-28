const CAMPOS = new Set(['cliente_id', 'peso_kg', 'ciudad_destino', 'direccion_destino', 'estado']);

function validarEnvio(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return ['Se esperaba un objeto JSON con los datos del envío'];
  }
  const errores = [];
  for (const campo of Object.keys(datos)) {
    if (!CAMPOS.has(campo)) errores.push(`Campo no permitido: ${campo}`);
  }
  if (!Number.isSafeInteger(datos.cliente_id) || datos.cliente_id <= 0) {
    errores.push('cliente_id debe ser un entero positivo dentro del rango seguro');
  }
  if (typeof datos.peso_kg !== 'number' || !Number.isFinite(datos.peso_kg) || datos.peso_kg <= 0) {
    errores.push('peso_kg debe ser un número finito mayor que cero');
  }
  for (const [campo, maximo] of Object.entries({ ciudad_destino: 100, direccion_destino: 200 })) {
    if (typeof datos[campo] !== 'string' || !datos[campo].trim()) errores.push(`${campo} es obligatorio y debe ser un texto no vacío`);
    else if (datos[campo].trim().length > maximo) errores.push(`${campo} no debe superar ${maximo} caracteres`);
  }
  if (datos.estado !== undefined && datos.estado !== 'registrado') {
    errores.push('Un envío nuevo debe tener estado registrado');
  }
  return errores;
}
function construirEnvio(datos) {
  return {
    cliente_id: datos.cliente_id, peso_kg: datos.peso_kg,
    ciudad_destino: datos.ciudad_destino.trim(), direccion_destino: datos.direccion_destino.trim(),
  };
}
module.exports = { validarEnvio, construirEnvio };
