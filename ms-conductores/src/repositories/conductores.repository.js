// Taller 1: almacenamiento propio en memoria; se reinicia al detener el proceso.
const conductores = [
  { id: 1, nombre: 'Carlos Ramírez', cedula: '0012345678', categoria_licencia: 'C2', telefono: '+573001234567', sede: 'Cali' },
  { id: 2, nombre: 'Diana López', cedula: '0098765432', categoria_licencia: 'C3', telefono: '+573102345678', sede: 'Medellín' },
  { id: 3, nombre: 'Jorge Pérez', cedula: '0011223344', categoria_licencia: 'C1', telefono: '+573203456789', sede: 'Bogotá' },
];
let siguienteId = 4;
const copiar = (conductor) => conductor ? { ...conductor } : null;

async function findAll() { return conductores.map(copiar); }
async function findById(id) { return copiar(conductores.find((c) => c.id === id)); }
async function create(conductor) {
  // Comprobar y escribir sin esperas evita duplicados en este proceso.
  if (conductores.some((c) => c.cedula === conductor.cedula)) {
    const error = new Error('Ya existe un conductor con esa cédula');
    error.code = 'CONDUCTOR_DUPLICADO';
    throw error;
  }
  const nuevo = { ...conductor, id: siguienteId++ };
  conductores.push(nuevo);
  return copiar(nuevo);
}
module.exports = { findAll, findById, create };
