# Despliegue de LogiRed (Taller 3)

Autor: Juan Santiago Gutiérrez Panesso · Redes y Servicios Multimedia (M3)

La aplicación queda publicada en **https://app.logiredtech.co** sobre dos máquinas virtuales Vagrant (Ubuntu 22.04).

## Arquitectura

```
 Navegador (Windows 172.16.0.177)
      │  HTTPS 443  (DNS: app.logiredtech.co → 172.16.0.181)
      ▼
 servidor2 · SRVBaseDatos · 172.16.0.181
   Apache  ── /            → frontend (/var/www/app)
           ── /api/usuarios     → 127.0.0.1:3001  ms-usuarios
           ── /api/clientes     → 127.0.0.1:3002  ms-clientes
           ── /api/envios       → 127.0.0.1:3003  ms-envios
           ── /api/conductores  → 127.0.0.1:3004  ms-conductores
      │  MySQL 3306 (solo desde 172.16.0.181)
      ▼
 servidor1 · SRVGestionPaquetes · 172.16.0.178
   MySQL: usuarios_db, clientes_db, envios_db, conductores_db (una base y un usuario por servicio)
   bind9: zona logiredtech.co
```

Decisiones de seguridad:

- Los microservicios escuchan solo en `127.0.0.1`: desde fuera únicamente se entra por el gateway Apache.
- Cada servicio corre con systemd bajo el usuario sin privilegios `nodeapps`. Su `.env` tiene `chmod 640`.
- MySQL acepta conexiones solo de servidor2, y cada usuario de base de datos solo ve su propia base.
- HTTPS con certificado propio: el puerto 80 de `app` solo redirige a 443.
- Cabeceras de seguridad: `nosniff`, `X-Frame-Options DENY`, `Content-Security-Policy`, y sin `X-Powered-By`.
- Todas las rutas de la API exigen un token JWT (401 sin token o con token inválido) y permisos por rol (403).

## Carpetas

| Carpeta | Contenido |
|---|---|
| `apache/` | `zz-app.conf` (puerto 80 → redirección) y `zz-app-ssl.conf` (443: frontend + gateway) |
| `systemd/` | Unidades de los 4 microservicios |
| `scripts/` | Scripts de despliegue en orden (se ejecutan dentro de cada VM con `sudo bash`) |
| `bases-de-datos.sql` | Creación de las 4 bases y sus usuarios (con marcadores en vez de contraseñas) |
| `secretos.ejemplo.txt` | Plantilla de claves. La copia real (`secretos.txt`) **nunca** va al repositorio |

## Orden de ejecución

Los scripts esperan estar en `/vagrant/taller3/`, que es la carpeta compartida de Vagrant, junto con `secretos.txt` y la carpeta `frontend/`.

| Paso | Máquina | Script | Qué hace |
|---|---|---|---|
| 0 | ambas | `0-diagnostico.sh` | Inventario de solo lectura |
| 1 | servidor1 | `1-servidor1-mysql.sh` | MySQL en la red interna, bases y usuarios de usuarios/conductores, firewall 3306 |
| 2 | servidor2 | `2-servidor2-microservicios.sh` | Node 22, usuario nodeapps, ms-usuarios y ms-conductores como servicios |
| 3 | servidor1 | `3-servidor1-dns.sh` | Registro `app` en la zona DNS |
| 4 | servidor2 | `4-servidor2-gateway.sh` | Vhost `app.logiredtech.co` con ProxyPass |
| 5 | servidor2 | `5-servidor2-usuarios.sh` | Cambia la clave del admin y crea los usuarios despacho y flota |
| 6a | servidor1 | `6a-servidor1-bases-clientes-envios.sh` | Bases de clientes y envíos |
| 6b | servidor2 | `6b-servidor2-clientes-envios.sh` | ms-clientes y ms-envios como servicios |
| 7 | servidor2 | `7-servidor2-frontend.sh` | Publica el frontend en `/var/www/app` |
| 8 | servidor2 | `8-servidor2-https.sh` | Certificado, vhost 443, cabeceras y firewall 443 |
| 9 | servidor2 | `9-servidor2-intranet-por-defecto.sh` | Renombra app.conf a zz-app.conf para que intranet siga siendo el sitio por defecto |

Después del paso 8, en Windows se marca el certificado como confiable:

```powershell
Import-Certificate -FilePath "<ruta>\app.logiredtech.co.crt" -CertStoreLocation Cert:\CurrentUser\Root
```

Si el navegador de Windows no resuelve `.logiredtech.co` porque hay varios adaptadores de red:

```powershell
Add-DnsClientNrptRule -Namespace ".logiredtech.co" -NameServers "172.16.0.178"
```

## Comprobaciones rápidas (en servidor2)

```bash
systemctl is-active ms-usuarios ms-clientes ms-envios ms-conductores
ss -tlnp | grep ':300'                                  # todos en 127.0.0.1
journalctl -u ms-conductores -f                         # registro de peticiones en vivo
curl -k -o /dev/null -w "%{http_code}\n" https://app.logiredtech.co/api/conductores   # 401 sin token
```
