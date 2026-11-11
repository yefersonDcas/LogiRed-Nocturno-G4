# ms-clientes · Taller 2

Microservicio de clientes de LogiRed. Usa Node.js 22 o superior, Express y mysql2 con la base propia `clientes_db`. El Taller 2 protege el CRUD con JWT y expone la consulta por lote que usa Envíos.

## Configuración y arranque

1. Inicie MySQL en XAMPP, en el puerto 3306.
2. Ejecute `npm ci` desde esta carpeta.
3. Use `.env.example` como referencia para configurar `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` en `.env`. Copie al mismo archivo el valor de `JWT_SECRET` que usa `ms-usuarios`. Guarde la clave en el `.env` local que Git ignora.
4. Configure la cuenta de base de datos con permisos `SELECT`, `INSERT`, `UPDATE` y `DELETE` sobre la tabla `clientes_db.clientes`.
5. Para una instalación nueva, importe [db/schema.sql](db/schema.sql) con una cuenta administradora. El archivo crea la tabla y carga tres clientes. Volver a insertar la semilla con los mismos documentos y correos produce duplicados.

Desde la carpeta del servicio:

```powershell
npm run dev
```

La URL local es `http://127.0.0.1:3002`. El arranque comprueba la conexión a MySQL. La terminal registra la hora, el método y la URL de cada petición, incluida la consulta `?ids=`.

## Autenticación y permisos

Inicie `ms-usuarios` y envíe `POST http://127.0.0.1:3001/usuarios/login` con el correo (`email`) y la contraseña (`password`) de una cuenta activa. En las rutas `/clientes`, envíe el campo `token` de la respuesta en `Authorization: Bearer <token>`. Un token ausente, inválido o vencido devuelve `401`. Un rol sin permiso devuelve `403`.

## Operaciones disponibles

| Método | Ruta | Acceso | Resultado |
|---|---|---|---|
| GET | `/health` | Público | `200` |
| GET | `/clientes` | `administrador`, `despacho` | `200`, arreglo ordenado por ID |
| GET | `/clientes/:id` | `administrador`, `despacho` | `200` con el cliente o `404` |
| POST | `/clientes` | `administrador`, `despacho` | `201` con el cliente y `Location` |
| PUT | `/clientes/:id` | `administrador`, `despacho` | `200` con el cliente actualizado o `404` |
| DELETE | `/clientes/:id` | `administrador` | `204` sin cuerpo o `404` |

El rol `flota` recibe `403` en el CRUD. `POST` y `PUT` reciben los campos editables completos. Un ID, filtro o cuerpo inválido devuelve `400` y un documento o correo duplicado devuelve `409`. Un `PUT` con los mismos valores devuelve `200`.

## Reglas y filtros

Campos obligatorios y longitudes máximas: `nombre` (150), `documento` (30), `telefono` (32), `email` (254) y `ciudad` (100). El modelo recorta espacios, pasa el documento a mayúsculas y el correo a minúsculas. El teléfono admite entre 7 y 15 dígitos y separadores habituales. La base impone la unicidad de documento y correo.

Los filtros se pueden combinar, por ejemplo `GET /clientes?ciudad=Cali&ids=1,3,8`. La consulta por IDs elimina repeticiones y omite IDs inexistentes. Un lote sin coincidencias devuelve `[]`. Use enteros positivos en formato decimal.

## Contrato con Envíos

`ms-envios` reenvía el Bearer de la petición original. Para validar una escritura consulta `GET /clientes/:id`. Para completar una respuesta consulta `GET /clientes?ids=1,3` y usa los campos `id`, `nombre` y `ciudad`.

## Ejemplo de creación

Envíe este cuerpo JSON a `POST http://127.0.0.1:3002/clientes` con un token autorizado.

```json
{
  "nombre": "Comercializadora del Pacífico",
  "documento": "900555123-4",
  "telefono": "+573001234567",
  "email": "contacto@pacifico.example",
  "ciudad": "Cali"
}
```

El `201` devuelve los campos del cliente, el `id` asignado y la cabecera `Location: /clientes/<id>`. Para modificar, use `PUT /clientes/<id>` con los cinco campos editables.

## Postman

Importe [la colección de Clientes](docs/ms-clientes.postman_collection.json) en Postman de escritorio. Configure `despacho_email`, `despacho_password`, `flota_email` y `flota_password` en un entorno local. Use cuentas activas de prueba con esos roles y seleccione el entorno al enviar las peticiones.

1. Ejecute **Preparación** para obtener los tokens. La colección guarda los tokens de ambas cuentas a partir del login.
2. Ejecute **Casos 14 a 18** en orden. Los casos comprueban `401` sin token o con token alterado, `200` con despacho, `403` al intentar crear con flota y `201` al crear con despacho.
3. Ejecute **Consulta por lote**. Usa el ID del caso 18 dos veces y comprueba que aparece una sola vez en el resultado. El caso 18 crea un cliente de prueba con documento y correo nuevos en cada ejecución.

## Archivos principales

- src/db.js: conexión a la base propia.
- db/schema.sql: creación de base, tabla, restricciones y datos iniciales.
- src/routes/clientes.routes.js: direcciones y métodos HTTP.
- src/middlewares/auth.js: verificación de JWT y permisos por rol.
- src/controllers/clientes.controller.js: lectura de ids y filtros, y respuestas HTTP.
- src/services/clientes.service.js: validaciones y reglas.
- src/models/cliente.js: campos y normalización.
- src/repositories/clientes.repository.js: consultas SQL con parámetros.
