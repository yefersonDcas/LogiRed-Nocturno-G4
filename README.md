# LogiRed-Nocturno-G4

Aplicación de **LogiRed** (paquetería nocturna entre Cali, Medellín y Bogotá) construida con microservicios REST en Node.js + Express y MySQL, desplegada en el ambiente de dos servidores del Módulo 2.

Redes y Servicios Multimedia · Módulo 3 · Universidad Autónoma de Occidente.

## Microservicios

| Carpeta | Puerto | Base de datos | Recurso | Responsable |
|---|---|---|---|---|
| [ms-usuarios](ms-usuarios) | 3001 | usuarios_db | `/usuarios` (login y tokens JWT) | Docente |
| [ms-clientes](ms-clientes) | 3002 | clientes_db | `/clientes` | Grupo |
| [ms-envios](ms-envios) | 3003 | envios_db | `/envios` | Yeferson Casso |
| [ms-conductores](ms-conductores) | 3004 | conductores_db | `/conductores` | Juan Santiago Gutiérrez |

Cada microservicio tiene su propio README con el contrato de la API, sus variables de entorno (`.env.example`) y su `db/schema.sql`. Cada uno usa **su propia base de datos**; las relaciones entre ellos van por la API REST, nunca por tablas compartidas:

- **Envíos → Clientes:** ms-envios valida el cliente con `GET /clientes/:id` y compone los clientes de una lista con una sola petición `GET /clientes?ids=`.
- **Envíos → Conductores:** igual con `GET /conductores/:id` y `GET /conductores?ids=`. Si el servicio consultado no responde, crear devuelve 503 y listar devuelve el objeto relacionado en `null` con un aviso.

## Seguridad

Todas las rutas exigen un token JWT emitido por ms-usuarios (`POST /usuarios/login`). Cada servicio verifica la firma con la misma `JWT_SECRET` (401 si falta o es inválido) y los permisos del rol (403). Roles: `administrador`, `despacho` y `flota`.

## Frontend

La carpeta [frontend](frontend) tiene la aplicación web (HTML, CSS y JavaScript sin librerías): inicio de sesión, página de inicio por rol y pantallas CRUD de envíos, clientes, conductores y usuarios. Llama a la API por el gateway en el mismo dominio (`/api/...`). Detalle en [frontend/README.md](frontend/README.md).

## Ejecutar en local (desarrollo)

En cada microservicio:

```bash
cd ms-conductores          # o el que corresponda
cp .env.example .env       # completar DB_PASSWORD y JWT_SECRET
mysql -u root -p < db/schema.sql
npm install
npm run dev
```

## Despliegue en el ambiente (servidor1 y servidor2)

```
Windows ──https──▶ app.<dominio> (DNS en servidor1) ──▶ servidor2: Apache
                                                         ├── /            → frontend (/var/www/app)
                                                         └── /api/<recurso> → 127.0.0.1:300X (microservicio)
                                                                              └──▶ MySQL en servidor1 (una base por servicio)
```

Resumen del paso a paso (el detalle, los archivos y los scripts están en [deploy/README.md](deploy/README.md)):

1. **servidor1:** instalar MySQL, poner su IP en `bind-address`, abrir 3306 en ufw solo para servidor2 y crear una base y un usuario por microservicio restringido a la IP de servidor2 ([deploy/bases-de-datos.sql](deploy/bases-de-datos.sql), sin contraseñas).
2. **servidor2:** instalar Node.js 22, git y mysql-client; crear el usuario de sistema `nodeapps`; clonar el repositorio en `/srv/<empresa>/app`.
3. **Cada microservicio** (primero ms-usuarios): `npm ci --omit=dev`, crear su tabla desde servidor2 con `db/schema.sql`, crear el `.env` de producción (permisos 640, grupo nodeapps) y su servicio en `/etc/systemd/system/` ([deploy/systemd](deploy/systemd)). Activarlo con `systemctl enable --now`.
4. **DNS:** agregar el registro `app` apuntando a servidor2 e incrementar el serial.
5. **Gateway:** host virtual de Apache con `ProxyPass /api/<recurso>` hacia cada microservicio ([deploy/apache](deploy/apache)); `a2enmod proxy proxy_http`, `apache2ctl configtest` y `systemctl reload apache2`.
6. **Frontend:** copiar `frontend/` a `/var/www/app`.
7. **Probar** con las colecciones de Postman de [deploy](deploy) (`baseUrl = https://app.<dominio>/api`).

Las contraseñas y la `JWT_SECRET` de producción se acuerdan en el grupo y **nunca** se suben al repositorio.
