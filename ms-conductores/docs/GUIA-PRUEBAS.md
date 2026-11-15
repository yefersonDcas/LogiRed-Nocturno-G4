# Guía de pruebas · ms-conductores

Paso a paso para demostrar el microservicio en vivo (sustentación).
Cada caso dice qué escribir en Postman, qué debe responder y qué archivo del código lo produce.

## 1. Encender todo (en este orden)

| # | Qué | Cómo | Cómo sé que funciona |
|---|---|---|---|
| 1 | MySQL | XAMPP Control Panel → **Start** en MySQL | Queda en verde, puerto **3307** |
| 2 | ms-usuarios (login) | Terminal 1 de VS Code: `cd ms-usuarios` → `npm run dev` | "escuchando en …:3001" |
| 3 | ms-conductores (mi servicio) | Terminal 2: `cd ms-conductores` → `npm run dev` | "ms-conductores escuchando en http://127.0.0.1:3004" |
| 4 | Postman | Colección **ms-conductores (LogiRed)** | — |

Si al arrancar sale `ECONNREFUSED`, MySQL está apagado o en otro puerto (revisar `DB_PORT` del `.env`).

## 2. Usuarios de prueba (viven en ms-usuarios)

| Email | Contraseña | Rol | Qué puede hacer con conductores |
|---|---|---|---|
| admin@empresa.com | Admin2026* | administrador | Todo |
| flota@empresa.com | Pruebas2026* | flota | Todo |
| despacho@empresa.com | Pruebas2026* | despacho | Solo consultar (GET) |

## 3. Sacar los tokens: carpeta "0. Login"

`POST http://127.0.0.1:3001/usuarios/login` · Authorization: **No Auth** · Body → raw → JSON:

```json
{ "email": "admin@empresa.com", "password": "Admin2026*" }
```

Responde **200** con `"token": "eyJ..."`. La colección guarda el token sola (variables `tokenAdmin`,
`tokenDespacho`, `tokenFlota`). A mano: copiar el token → pestaña **Authorization** → **Bearer Token** → pegar.

## 4. CRUD: carpeta "1. CRUD" (token de administrador)

Cuerpo de ejemplo para POST y PUT (Body → raw → JSON):

```json
{ "nombre": "Pedro Gil", "cedula": "1112223334", "categoria_licencia": "C1", "telefono": "3001234567", "sede": "Cali" }
```

| # | Petición | Esperado | Dónde pasa en el código |
|---|---|---|---|
| 1 | GET `/conductores` | 200 + lista | routes → controller.listar → service.listar → repository.findAll |
| 2 | GET `/conductores?sede=Cali` | 200 solo Cali | controller.leerFiltros lee `?sede=` → repository arma `WHERE sede = ?` |
| 3 | GET `/conductores?ids=1,3` | 200 solo esos | controller.leerFiltros → repository `WHERE id IN (?)` |
| 4 | GET `/conductores/1` | 200 | repository.findById |
| 5 | GET `/conductores/9999` | 404 | service.obtener: si no existe lanza `HttpError(404)` |
| 6 | GET `/conductores/abc` | 400 | controller.leerId: el id debe ser entero positivo |
| 7 | POST `/conductores` + cuerpo | 201 + cabecera Location | model valida → repository.create (INSERT) |
| 8 | POST sin `nombre` | 400 + detalles | models/conductor.js → validarConductor |
| 9 | POST con cédula `0012345678` | 409 | MySQL rechaza (UNIQUE) → service.traducirError → 409 |
| 10 | PUT `/conductores/{id}` + cuerpo completo | 200 | service.actualizar → repository.update |
| 11 | PUT `/conductores/9999` | 404 | service.actualizar primero busca el registro |
| 12 | DELETE `/conductores/{id}` | 204 sin cuerpo | repository.remove (`affectedRows`) |
| 13 | DELETE el mismo otra vez | 404 | ya no existe |

## 5. Seguridad: carpeta "2. Seguridad"

| # | Petición | Token | Esperado | Por qué |
|---|---|---|---|---|
| 14 | GET `/conductores` | ninguno (No Auth) | **401** | `verificarToken`: falta la cabecera Authorization |
| 15 | GET `/conductores` | inventado / modificado | **401** | `jwt.verify` falla: la firma no cuadra con `JWT_SECRET` |
| 16 | GET `/conductores` | despacho | **200** | GET solo exige token válido |
| 17 | POST `/conductores` | despacho | **403** | `requiereRol('administrador','flota')` no incluye despacho |
| 18 | POST `/conductores` | flota | **201** | flota está en la lista de roles permitidos |

Archivos: `src/middlewares/auth.js` (verificarToken → 401, requiereRol → 403) y
`src/routes/conductores.routes.js` (qué ruta lleva qué guardia).

**401 vs 403:** 401 = "no sé quién eres" (sin token o token falso). 403 = "sé quién eres, pero tu rol no puede".

## 6. Lo que se ve en la terminal

Cada petición imprime una línea (middleware de registro en `src/app.js`):

```
7:02:15 PM  POST /conductores → 403  (4 ms, rol=despacho)
```

Hora · método y ruta · código respondido · tiempo · rol del token.

## 7. Ver la base de datos

Shell de XAMPP → `mysql -u root -p` (Enter, sin clave):

```sql
USE conductores_db;
DESCRIBE conductores;           -- columnas, tipos, UNIQUE en cedula
SELECT * FROM conductores;      -- los registros
```

Configuración: `.env` (`DB_HOST`, `DB_PORT=3307`, `DB_NAME=conductores_db`, `DB_USER=conductores_user`) ·
conexión en `src/db.js` · tabla en `db/schema.sql`.

**Persistencia:** crear un conductor → Ctrl + C en la terminal → `npm run dev` → GET: sigue ahí, porque está en MySQL.

## 8. Relación con ms-envios

Cada envío guarda el `conductor_id` del conductor que lo lleva. ms-envios me consulta a mí; yo no consulto a nadie.

Para probarlo en este PC tienen que estar corriendo ms-usuarios (3001), ms-clientes (3002), ms-envios (3003)
y ms-conductores (3004). Las pruebas se hacen sobre **ms-envios**; lo que yo muestro es **mi terminal**:

| # | En ms-envios… | Esperado | Lo que se ve en MI terminal |
|---|---|---|---|
| 19 | POST /envios con `conductor_id` que existe | 201, con `conductor` incluido | `GET /conductores/1 → 200` |
| 20 | POST /envios con `conductor_id: 9999` | 400 | `GET /conductores/9999 → 404` |
| 21 | GET /envios/:id | 200, con `conductor` incluido | `GET /conductores?ids=… → 200` |
| 22 | GET /envios | 200 | **una sola** línea `GET /conductores?ids=… → 200` |
| 23 | GET /envios con ms-conductores **apagado** (Ctrl + C) | 200, `conductor: null` + aviso | (nada: estoy apagado) |
| 24 | POST /envios con ms-conductores **apagado** | 503 | (nada: estoy apagado) |

Frase para la sustentación: "Mi servicio es el consultado. ms-envios valida que el conductor exista con
GET /conductores/:id y trae los nombres de muchos conductores en una sola petición con ?ids=.
Ningún servicio lee mi base de datos; todo pasa por mi API, reenviando el token del usuario."
