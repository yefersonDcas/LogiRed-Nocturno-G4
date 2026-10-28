# ms-clientes · Taller 1

Microservicio de clientes comerciales de LogiRed. Usa Node.js 22 o superior y Express, con controlador, servicio, modelo y repositorio.

## Alcance actual

Implementa listado, consulta por id y creación. Los datos son propios y se guardan en memoria; se pierden al reiniciar. Puerto predeterminado: 3002.

El diseño de la semana 1 está en [Modelo de dominio y contratos](../docs/semana-1.md).

## Entidad y validaciones

Campos: `id, nombre, documento, telefono, email, ciudad`. El servidor asigna id.

Todos los campos del cuerpo son obligatorios. Se recortan espacios y se rechazan textos vacíos, arreglos y campos desconocidos.

| Campo | Regla |
|---|---|
| nombre | Texto de hasta 150 caracteres |
| documento | Texto de hasta 30 caracteres; letras, números y guiones; conserva ceros iniciales y se guarda en mayúsculas |
| telefono | Texto de hasta 32 caracteres con entre 7 y 15 dígitos; admite + inicial, espacios, paréntesis y guiones |
| email | Formato de correo válido, hasta 254 caracteres; se guarda en minúsculas |
| ciudad | Texto de hasta 100 caracteres |

Documento y email son únicos después de normalizarlos. Los duplicados devuelven 409.

## Ejecutar

Desde esta carpeta:

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

Si ya tiene .env, conserve ese archivo y ajuste PORT y HOST según su equipo.

## Endpoints implementados

| Método | Ruta | Resultado |
|---|---|---|
| GET | /health | 200, estado del servicio |
| GET | /clientes | 200, arreglo de clientes |
| GET | /clientes/:id | 200, cliente; 400 si el id es inválido; 404 si no existe |
| POST | /clientes | 201, cliente y cabecera Location; 400 si los datos son inválidos; 409 si hay duplicados |

Ejemplo del cuerpo de POST:

```json
{
  "nombre": "Comercializadora del Pacífico",
  "documento": "900555123-4",
  "telefono": "+573001234567",
  "email": "contacto@pacifico.example",
  "ciudad": "Cali"
}
```

## Etapas siguientes

Modificar, eliminar y persistir en una base de datos corresponden al Taller 2. La consulta por lotes para componer relaciones y los permisos se implementarán en el Taller 3. Por ahora quedan descritos en el documento de diseño.
