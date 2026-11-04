# ms-conductores · MySQL

Microservicio de conductores de LogiRed, organizado en rutas, controlador, servicio, modelo y repositorio. Usa Node.js 22 o superior, Express y mysql2, con una base propia: conductores_db.

## Configuración y arranque

1. Inicie MySQL en XAMPP, en el puerto 3306.
2. Instale las dependencias desde esta carpeta con npm ci.
3. Si todavía no existe .env, copie .env.example como .env y complete DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD.
4. La cuenta conductores_user debe existir en MySQL con la misma contraseña del .env y permisos SELECT, INSERT, UPDATE y DELETE sobre conductores_db.*. Escribir la cuenta en .env no la crea en el servidor.
5. Importe db/schema.sql con una cuenta administradora. El archivo crea la base y la tabla sin borrar datos. Incluye tres registros iniciales y permite volver a ejecutarlo.

En la consola de MySQL, el comando para importar desde este equipo es:

```sql
SOURCE C:/Users/USER/OneDrive/Escritorio/LogiRed-Nocturno-G4/ms-conductores/db/schema.sql;
```

Desde la carpeta del servicio:

```powershell
npm run dev
```

También puede usar npm start. Puerto HTTP predeterminado: 3004. Al iniciar se comprueba la conexión a la base; si falla, la consola indica el código y el servidor no comienza a escuchar.

Los datos se guardan en MySQL y permanecen después de reiniciar. Los registros creados anteriormente en memoria no se recuperan automáticamente. Cada servicio accede únicamente a su base.

## Operaciones disponibles

| Método | Ruta | Resultado |
|---|---|---|
| GET | /health | 200, identifica el servicio; no consulta la base |
| GET | /conductores | 200, listado ordenado por id |
| GET | /conductores/:id | 200, registro; 404 si no existe |
| POST | /conductores | 201, registro creado y cabecera Location |
| PUT | /conductores/:id | 200, registro actualizado; 404 si no existe |
| DELETE | /conductores/:id | 204 sin cuerpo; 404 si no existe |

POST y PUT reciben los campos editables completos. Se rechazan campos desconocidos, arreglos y campos obligatorios vacíos. Un id, filtro o cuerpo inválido devuelve 400. Un duplicado devuelve 409. PUT con los mismos valores devuelve 200.

## Reglas y filtros

Campos obligatorios: nombre (máximo 150), cedula (20), categoria_licencia (2), telefono (32) y sede (20).

La cédula es un texto numérico único, conserva ceros iniciales y no puede estar formada solo por ceros. El teléfono admite entre 7 y 15 dígitos y separadores habituales.

Catálogo de categoria_licencia: A1, A2, B1, B2, B3, C1, C2 y C3; se guarda en mayúsculas. Sedes: Cali, Medellín y Bogotá; se aceptan diferencias de mayúsculas y tildes y se guarda el nombre canónico. Estas comprobaciones validan el formato del registro.

Ejemplos de filtros:
- GET /conductores?sede=Cali
- GET /conductores?categoria_licencia=C2
- GET /conductores?sede=Medellín&categoria_licencia=C3

Los filtros se pueden combinar. GET /conductores?ids=1,3,8 devuelve los ids existentes en un lote, elimina repeticiones y omite ids inexistentes. Un lote sin coincidencias devuelve []. Los ids deben ser enteros positivos en formato decimal.

## Ejemplo de creación

POST http://localhost:3004/conductores

```json
{
  "nombre": "María Torres",
  "cedula": "1002345678",
  "categoria_licencia": "C2",
  "telefono": "+573001112233",
  "sede": "Cali"
}
```

Para modificar, use PUT http://localhost:3004/conductores/4 con el cuerpo completo del registro. Para consultar, use GET con el id devuelto por POST.

## Archivos principales

- src/db.js: conexión a la base propia.
- db/schema.sql: creación de base, tabla, restricciones y datos iniciales.
- src/routes/conductores.routes.js: direcciones y métodos HTTP.
- src/controllers/conductores.controller.js: lectura de ids y filtros, y respuestas HTTP.
- src/services/conductores.service.js: validaciones y reglas.
- src/models/conductor.js: campos y normalización.
- src/repositories/conductores.repository.js: consultas SQL con parámetros.
