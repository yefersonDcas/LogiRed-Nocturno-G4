# Frontend de LogiRed

Autor: Juan Santiago Gutiérrez Panesso

HTML, CSS y JavaScript sin librerías. Apache lo sirve en `https://app.logiredtech.co`, en el mismo dominio que el gateway `/api`, así que no hace falta CORS.

## Páginas

| Página | Quién entra | Para qué |
|---|---|---|
| `login.html` | todos | `POST /api/usuarios/login`, guarda el token y redirige según el rol |
| `admin.html`, `despacho.html`, `flota.html` | cada rol a la suya | Inicio con tarjetas de los módulos permitidos y sus totales |
| `envios.html` | administrador, despacho | CRUD de envíos. Muestra el cliente y el conductor que compone ms-envios, y los avisos si un servicio está caído |
| `clientes.html` | administrador, despacho | CRUD de clientes con filtro por ciudad |
| `conductores.html` | todos (solo administrador y flota escriben) | CRUD de conductores con filtros por sede y licencia |
| `seguridad.html` | todos | El token JWT por dentro y un laboratorio que provoca 200 / 401 / 403 reales |

## JavaScript

| Archivo | Responsabilidad |
|---|---|
| `js/api.js` | Toda llamada pasa por `api()`: agrega `Authorization: Bearer <token>` y traduce 400/401/403/404/409/503 |
| `js/sesion.js` | Token en `sessionStorage`, protección de páginas, encabezado, contador y cierre al vencer el token, permisos por rol |
| `js/ui.js` | Avisos, `escaparHtml` (evita XSS), lectura de formularios |
| `js/<módulo>.js` | Lógica de cada pantalla |

Los permisos del frontend solo **esconden botones**. Quien decide es el backend (`verificarToken` → 401, `requiereRol` → 403).
