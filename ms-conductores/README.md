# ms-conductores · Taller 1

Gestiona conductores de la flota de LogiRed. Usa Node.js 22 o superior y Express, con controlador, servicio, modelo y repositorio.

## Alcance actual

Listado, consulta por id y creación, con almacenamiento propio en memoria. Los datos se pierden al reiniciar. Incluye tres conductores de ejemplo; el siguiente id es 4.

## Entidad y validaciones

Campos: id, nombre, cedula, categoria_licencia, telefono y sede. El servidor asigna el id. Todos los campos del cuerpo son obligatorios.

| Campo | Regla |
|---|---|
| nombre | Texto no vacío de hasta 150 caracteres |
| cedula | Texto de hasta 20 dígitos, no formado solo por ceros; conserva ceros iniciales y debe ser único |
| categoria_licencia | Catálogo del proyecto: A1, A2, B1, B2, B3, C1, C2 o C3; se guarda en mayúsculas |
| telefono | Texto de hasta 32 caracteres con entre 7 y 15 dígitos; admite + inicial, espacios, paréntesis y guiones |
| sede | Cali, Medellín o Bogotá; admite diferencias de mayúsculas y tildes, y se guarda con el nombre canónico |

Se recortan los espacios sobrantes. El teléfono se guarda sin espacios, paréntesis ni guiones. Se rechazan arreglos, campos desconocidos y números enviados en lugar de texto para cedula o telefono.

Las validaciones comprueban el formato del registro; no verifican autenticidad, vigencia de la licencia ni documentos externos.

## Ejecutar

Desde esta carpeta, instale las dependencias y prepare .env si todavía no existe:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Puerto predeterminado: 3004. Si ya existe .env, conserve su contenido y ajuste PORT a 3004. HOST predeterminado: 127.0.0.1.

## Endpoints

| Método | Ruta | Respuesta |
|---|---|---|
| GET | /health | 200, estado del servicio |
| GET | /conductores | 200, arreglo de conductores |
| GET | /conductores/:id | 200, conductor; 400 si el id es inválido; 404 si no existe |
| POST | /conductores | 201, conductor y cabecera Location; 400 si los datos son inválidos; 409 si la cédula ya existe |

Crear un conductor: POST http://localhost:3004/conductores

```json
{
  "nombre": "María Torres",
  "cedula": "1002345678",
  "categoria_licencia": "C2",
  "telefono": "+573001112233",
  "sede": "Cali"
}
```

Consultar el listado: GET http://localhost:3004/conductores

Consultar un registro: GET http://localhost:3004/conductores/4

## Archivos

| Archivo | Función |
|---|---|
| src/index.js | Arranca el servidor |
| src/app.js | Configura JSON, rutas y respuestas de error |
| src/routes/conductores.routes.js | Asocia las peticiones a cada operación |
| src/controllers/conductores.controller.js | Recibe y responde las peticiones; valida el id |
| src/services/conductores.service.js | Coordina las validaciones y operaciones |
| src/models/conductor.js | Valida y prepara los datos |
| src/repositories/conductores.repository.js | Guarda y consulta los conductores en memoria |
| src/utils/http-error.js | Representa errores con código, mensaje y detalles |
