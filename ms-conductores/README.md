# ms-conductores · Contrato de la API

Microservicio de **conductores** de LogiRed S.A.S. (Redes y Servicios Multimedia · Módulo 3).
Gestiona los conductores de la flota de las tres sedes. Responsable: Juan Santiago Gutiérrez.
Puerto: **3004**.

Está organizado en capas: rutas → controlador → servicio → modelo → repositorio, con Node.js + Express
y su propia base de datos MySQL (`conductores_db`).

## Cómo ejecutarlo

Requisitos: Node.js 22.9 o superior y MySQL 8 (sirve el de XAMPP en el puerto 3306).

1. Crear la base de datos y su usuario, como administrador (root), en MySQL Workbench o en la consola:

```sql
CREATE DATABASE IF NOT EXISTS conductores_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'conductores_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT SELECT, INSERT, UPDATE, DELETE ON conductores_db.* TO 'conductores_user'@'localhost';
```

2. Crear la tabla y los registros iniciales con `db/schema.sql`. Desde la carpeta `ms-conductores`:

```
mysql -u root -p
mysql> SOURCE db/schema.sql;
```

   El script se puede ejecutar varias veces: no borra datos ni duplica los registros iniciales.

3. Copiar `.env.example` como `.env` y poner en `DB_PASSWORD` la misma clave del paso 1.
   El archivo `.env` **no** se sube al repositorio.

4. Instalar dependencias (express, mysql2 y jsonwebtoken) y arrancar:

```powershell
npm install
npm run dev
```

   Al iniciar se comprueba la conexión a la base: si falla, la consola muestra el código del error
   y el servicio no empieza a escuchar. Verificación: `GET http://localhost:3004/health`.

### Variables de entorno

| Variable | Ejemplo | Para qué |
|---|---|---|
| PORT | 3004 | Puerto HTTP del servicio |
| HOST | 127.0.0.1 | Solo acepta conexiones del mismo equipo (detrás del gateway) |
| DB_HOST | 127.0.0.1 | Servidor MySQL (en el Taller 3: la IP de servidor1) |
| DB_PORT | 3306 | Puerto de MySQL |
| DB_NAME | conductores_db | Base de datos propia del servicio |
| DB_USER | conductores_user | Usuario de MySQL solo para esta base |
| DB_PASSWORD | — | Clave de ese usuario (solo en `.env`) |
| JWT_SECRET | — | Clave para verificar los tokens: la **misma** de ms-usuarios y de todo el grupo (solo en `.env`) |

## Representación de un conductor

Así responde `GET /conductores/1`:

```json
{
  "id": 1,
  "nombre": "Carlos Ramírez",
  "cedula": "0012345678",
  "categoria_licencia": "C2",
  "telefono": "+573001234567",
  "sede": "Cali"
}
```

### Atributos

| Atributo | Tipo | ¿Obligatorio al crear? | Reglas |
|---|---|---|---|
| id | entero | No: lo asigna el servicio | Positivo y único; el cliente nunca lo envía |
| nombre | texto | Sí | No vacío, máximo 150 caracteres; se guarda sin espacios al inicio ni al final |
| cedula | texto | Sí | Solo dígitos, máximo 20, no puede ser solo ceros; conserva ceros iniciales; **única (si se repite: 409)** |
| categoria_licencia | texto | Sí | Una de: A1, A2, B1, B2, B3, C1, C2, C3; se guarda en mayúsculas |
| telefono | texto | Sí | Entre 7 y 15 dígitos; admite `+` inicial, espacios, paréntesis y guiones; se guarda sin separadores |
| sede | texto | Sí | Una de: Cali, Medellín, Bogotá; acepta diferencias de mayúsculas y tildes y guarda el nombre oficial |

Los campos que no estén en la tabla se rechazan con 400 (`Campo no permitido`).

### Regla de negocio

La **cédula es única**: dos conductores no pueden tener el mismo documento de identidad, porque la empresa
asigna vehículos y rutas a una persona concreta. Si se intenta crear o actualizar un conductor con una cédula
que ya existe, el servicio responde **409 Conflict**. Además, la sede y la categoría de licencia deben estar
dentro de su catálogo (si no, **400**).

## Endpoints

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Salud | GET | /health | — | 200 `{"servicio":"ms-conductores","estado":"ok"}` | — (pública) |
| Listar | GET | /conductores | — | 200 + arreglo | 401 |
| Filtrar | GET | /conductores?sede=Cali · ?categoria_licencia=C2 | — | 200 + arreglo filtrado | 400 filtro inválido · 401 |
| Consultar por lotes | GET | /conductores?ids=1,3,8 | — | 200 + arreglo con esos registros | 400 ids inválidos · 401 |
| Obtener | GET | /conductores/:id | — | 200 + objeto | 400 id inválido · 401 · 404 |
| Crear | POST | /conductores | JSON sin id | 201 + objeto + cabecera Location | 400 · 401 · 403 · 409 |
| Actualizar | PUT | /conductores/:id | JSON completo sin id | 200 + objeto actualizado | 400 · 401 · 403 · 404 · 409 |
| Eliminar | DELETE | /conductores/:id | — | 204 sin cuerpo | 400 · 401 · 403 · 404 |

- Los filtros se pueden combinar: `GET /conductores?sede=Medellín&categoria_licencia=C3`.
- `?ids=` devuelve los registros existentes de la lista, sin repetidos y ordenados por id; los ids que no
  existen se omiten y una lista sin coincidencias devuelve `[]`. Es la consulta que usan otros microservicios
  para traer varios conductores en **una sola petición**.
- PUT reemplaza el registro: se envían todos los campos.

### Ejemplo: crear

```http
POST http://localhost:3004/conductores
Content-Type: application/json

{
  "nombre": "María Torres",
  "cedula": "1002345678",
  "categoria_licencia": "C2",
  "telefono": "+57 300 111 2233",
  "sede": "cali"
}
```

Respuesta `201 Created` con cabecera `Location: /conductores/4`:

```json
{
  "id": 4,
  "nombre": "María Torres",
  "cedula": "1002345678",
  "categoria_licencia": "C2",
  "telefono": "+573001112233",
  "sede": "Cali"
}
```

### Ejemplo: listar

`GET http://localhost:3004/conductores?sede=Cali` → `200 OK`:

```json
[
  {
    "id": 1,
    "nombre": "Carlos Ramírez",
    "cedula": "0012345678",
    "categoria_licencia": "C2",
    "telefono": "+573001234567",
    "sede": "Cali"
  }
]
```

### Formato de los errores

Todos los errores responden con el mismo formato; `detalles` aparece solo en los errores de validación:

```json
{
  "error": "Datos inválidos",
  "detalles": ["cedula es obligatorio y debe ser un texto no vacío", "sede debe ser una de: Cali, Medellín, Bogotá"]
}
```

## Seguridad

Todas las rutas de `/conductores` exigen un **token JWT** en la cabecera
`Authorization: Bearer <token>`. El token lo entrega ms-usuarios al iniciar sesión
(`POST /usuarios/login`) y lleva el `id`, el `nombre` y el `rol` del usuario.

ms-conductores **no le pregunta nada a ms-usuarios**: verifica la firma del token con la clave
`JWT_SECRET` de su `.env`, que es la misma en todos los microservicios del grupo. Si alguien modifica
el token (por ejemplo, para cambiarse el rol), la firma deja de coincidir y se rechaza.

El middleware `src/middlewares/auth.js` es el mismo archivo de ms-usuarios, copiado sin cambios:

- `verificarToken`: sin token, con un token inventado o vencido → **401**. Si es válido, deja los datos en `req.usuario`.
- `requiereRol(...)`: si el rol del token no está en la lista → **403**.

Permisos sobre conductores (tabla de roles de LogiRed):

| Rol | Consultar (GET) | Crear, modificar y eliminar (POST, PUT, DELETE) |
|---|---|---|
| administrador | Sí | Sí |
| flota | Sí | Sí |
| despacho | Sí | No (403) |

`GET /health` queda pública: solo indica que el servicio está vivo y no devuelve datos.

## Relaciones

ms-conductores **no guarda referencias** a otros microservicios: es de los **consultados**.
La entidad Vehículos guarda `conductor_id` y consulta a este servicio por REST:

| Me consulta | Peticiones que me hace | Campos que no puedo cambiar sin avisar |
|---|---|---|
| ms-vehiculos | `GET /conductores/:id` (validar al crear y actualizar) · `GET /conductores?ids=…` (componer al consultar) | id, nombre, telefono |

Ningún otro servicio lee la base `conductores_db`: los datos de los conductores solo se obtienen a través de esta API.

## Pruebas

La colección de Postman está en `docs/ms-conductores.postman_collection.json` (Import → File).
Trae los casos 1 a 18 del Taller 2 con la verificación del código esperado, en tres carpetas:

1. **00 Preparación**: inicia sesión en ms-usuarios (puerto 3001) como administrador, crea una sola vez
   un usuario de despacho y uno de flota, y guarda el token de cada uno. Requiere ms-usuarios corriendo
   con la misma `JWT_SECRET`.
2. **CRUD (1 a 13)**: se ejecutan con el token del administrador. El caso 07 guarda el id creado, que usan los casos 10, 12 y 13.
3. **Seguridad (14 a 18)**: sin token (401), token inventado (401), despacho consulta (200),
   despacho intenta crear (403) y flota crea (201).

Se ejecuta todo en orden con *Run collection*. Las contraseñas de prueba están en las variables
de la colección (`passwordAdmin`, `passwordPruebas`).

## Archivos principales

| Archivo | Capa | Su trabajo |
|---|---|---|
| src/routes/conductores.routes.js | Presentación: rutas | Qué función atiende cada método + URI y qué roles pueden usarla |
| src/middlewares/auth.js | Seguridad | Verificar el token (401) y el rol (403) antes de llegar al controlador |
| src/controllers/conductores.controller.js | Presentación: controlador | Leer id y filtros de la petición y armar la respuesta (código + JSON) |
| src/services/conductores.service.js | Lógica de negocio | Validar, aplicar la regla de cédula única y decidir 404 / 409 |
| src/models/conductor.js | Modelo | Campos, catálogos y normalización |
| src/repositories/conductores.repository.js | Acceso a datos | Consultas SQL parametrizadas sobre `conductores_db` |
| src/db.js | Acceso a datos | Pool de conexiones con los datos del `.env` |
| db/schema.sql | — | Base, tabla, restricciones y datos iniciales |
