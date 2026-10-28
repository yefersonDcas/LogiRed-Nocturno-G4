// Taller 1: almacenamiento propio en memoria; se reinicia al detener el proceso.
const clientes = [
  { id: 1, nombre: 'Comercializadora del Valle', documento: '900123456-7', telefono: '+573001234567', email: 'contacto@valle.example', ciudad: 'Cali' },
  { id: 2, nombre: 'Laura Gómez', documento: '0012345678', telefono: '+573102345678', email: 'laura@example.com', ciudad: 'Medellín' },
  { id: 3, nombre: 'Andrés Castillo', documento: '0098765432', telefono: '+573203456789', email: 'andres@example.com', ciudad: 'Bogotá' },
];
let siguienteId = 4;
const copiar = (cliente) => cliente ? { ...cliente } : null;

async function findAll() { return clientes.map(copiar); }
async function findById(id) { return copiar(clientes.find((c) => c.id === id)); }
async function create(cliente) {
  for (const campo of ['documento', 'email']) {
    if (clientes.some((c) => c[campo] === cliente[campo])) {
      const error = new Error(`Ya existe un cliente con ese ${campo}`);
      error.code = 'CLIENTE_DUPLICADO';
      throw error;
    }
  }
  const nuevo = { ...cliente, id: siguienteId++ };
  clientes.push(nuevo);
  return copiar(nuevo);
}
module.exports = { findAll, findById, create };
