# ms-envios

Microservicio de envíos de LogiRed. Usa Node.js 22 o superior, Express y mysql2 con la base propia `envios_db`. El Taller 2 protege el CRUD con JWT e integra los datos de Clientes por REST.

## Configuración y arranque

1. Inicie MySQL en XAMPP, en el puerto 3306.
2. Ejecute `npm ci` desde esta carpeta.
3. Use `.env.example` como referencia para configurar la base de datos en `.env`. Configure el mismo `JWT_SECRET` que en Usuarios y Clientes. En local, use `CLIENTES_URL=http://127.0.0.1:3002`. Guarde la clave en el `.env` local que Git ignora.
4. Se configuro la cuenta de base de datos con permisos `SELECT`, `INSERT`, `UPDATE` y `DELETE` sobre la tabla `envios_db.envios`. Para una instalación nueva, importar [db/schema.sql](db/schema.sql) con una cuenta administradora. La tabla empieza vacía.
5. Arranque de Usuarios en el puerto `3001` y Clientes en el `3002`.

Desde la carpeta del servicio:

```powershell
npm run dev
```

La URL local de Envíos es `http://127.0.0.1:3003`. El arranque comprueba la conexión a MySQL.

## Autenticación y permisos

 `POST http://127.0.0.1:3001/usuarios/login` con `email` y `password`. En las rutas `/envios` use el campo `token` de la respuesta en `Authorization: Bearer <token>`. Un token ausente, inválido o vencido devuelve `401`. Un rol sin permiso devuelve `403`.

## Operaciones disponibles

| Método | Ruta | Acceso | Resultado |
|---|---|---|---|
| GET | `/health` | Público | `200` |
| GET | `/envios` | `administrador`, `despacho` | `200`, arreglo ordenado por ID con `cliente` |
| GET | `/envios/:id` | `administrador`, `despacho` | `200` con el envío y `cliente` o `404` |
| POST | `/envios` | `administrador`, `despacho` | `201` con el envío, `cliente` y `Location` |
| PUT | `/envios/:id` | `administrador`, `despacho` | `200` con el envío actualizado y `cliente` o `404` |
| DELETE | `/envios/:id` | `administrador` | `204` sin cuerpo o `404` |

El rol `flota` recibe `403` en el CRUD. `POST` y `PUT` reciben los campos editables completos. Un ID, filtro o cuerpo inválido devuelve `400` y una guía duplicada devuelve `409`. Un `PUT` con los mismos valores devuelve `200`.

## Reglas y filtros

Campos obligatorios: cliente_id (entero positivo), peso_kg (número finito mayor que cero), ciudad_destino (máximo 100) y direccion_destino (máximo 200).

estado admite registrado, en_transito o entregado. Si se omite en POST, se usa registrado. Si se omite en PUT, se conserva el estado actual. Se permite elegir cualquiera de los tres estados.

El servidor genera id, numero_guia y fecha_registro; esos campos se conservan al actualizar y no se aceptan en el cuerpo. La guía es única y la fecha se devuelve como ISO en UTC. El peso se guarda como DOUBLE para conservar valores positivos sin imponer una cantidad fija de decimales.

Ejemplos de filtros:
- GET /envios?estado=en_transito
- GET /envios?cliente_id=1
- GET /envios?ciudad_destino=Bogotá
- GET /envios?estado=registrado&cliente_id=1

Los filtros se pueden combinar. GET /envios?ids=1,3,8 devuelve los ids existentes en un lote, elimina repeticiones y omite ids inexistentes. Un lote sin coincidencias devuelve []. Los ids deben ser enteros positivos en formato decimal.

## Relación con Clientes

Envíos almacena `cliente_id` como referencia y reenvía el Bearer original en sus consultas a Clientes.

| Momento | Petición a Clientes | Comportamiento de Envíos |
|---|---|---|
| Antes de crear o actualizar | `GET /clientes/:id` | Guarda si el cliente existe. Devuelve `400` si falta, `503` si Clientes no responde y `502` si devuelve un estado inesperado. En los tres casos de error se cancela la escritura. |
| Al responder una consulta, creación o actualización exitosa | `GET /clientes?ids=1,3` | Agrega `cliente: { id, nombre, ciudad }` a cada envío. Si Clientes omite un ID, agrega `cliente: null`. Si la consulta falla, agrega `cliente: null` y `aviso: "ms-clientes no disponible"`, con el estado de éxito de la operación. |

El listado hace una sola llamada con los IDs únicos. Un listado vacío devuelve `[]` y hace cero llamadas a Clientes. El objeto `cliente` pertenece a la respuesta y se obtiene en cada consulta.

## Ejemplo de creación

Envíe este cuerpo JSON a `POST http://127.0.0.1:3003/envios` con un token autorizado y un `cliente_id` que exista.

```json
{
  "cliente_id": 1,
  "peso_kg": 2.5,
  "ciudad_destino": "Bogotá",
  "direccion_destino": "Calle 10 # 20-30",
  "estado": "en_transito"
}
```

El `201` devuelve el envío con `id`, `numero_guia`, `fecha_registro` y el objeto `cliente`, además de `Location: /envios/<id>`. Para modificar, use `PUT /envios/<id>` con los campos editables. El campo `cliente` lo agrega el servicio.

## Postman

Importe [la colección de Envíos](docs/ms-envios.postman_collection.json) en Postman de escritorio. Configure `despacho_email` y `despacho_password` en el entorno local y selecciónelo. Debe existir al menos un cliente de prueba.

1. Con Usuarios, Clientes y Envíos activos, ejecute **Preparación**. El login guarda el token y la consulta a Clientes selecciona IDs existentes y uno inexistente.
2. Ejecute **Casos 19 a 22 con Clientes activo** en orden. Las peticiones de creación guardan dos IDs de envíos de prueba. En el caso 22, revise la terminal de Clientes y compruebe que el listado genera una sola línea `GET /clientes?ids=…`.
3. Detenga únicamente `ms-clientes` con `Ctrl+C` en su terminal. Ejecute **Casos 23 y 24 con Clientes detenido**. El listado devuelve `200` con el aviso y el intento de creación devuelve `503`. Al terminar, vuelva a arrancar Clientes.

## Archivos principales

- src/db.js: conexión a la base propia.
- db/schema.sql: creación de base, tabla, restricciones y configuración de columnas.
- src/routes/envios.routes.js: direcciones y métodos HTTP.
- src/middlewares/auth.js: verificación de JWT y permisos por rol.
- src/clients/clientes.client.js: validación y consulta por lotes a Clientes.
- src/controllers/envios.controller.js: lectura de ids y filtros, y respuestas HTTP.
- src/services/envios.service.js: validaciones y reglas.
- src/models/envio.js: campos y normalización.
- src/repositories/envios.repository.js: consultas SQL con parámetros.
