# ms-clientes · MySQL

Microservicio de clientes de LogiRed, organizado en rutas, controlador, servicio, modelo y repositorio. Usa Node.js 22 o superior, Express y mysql2, con una base propia: clientes_db.

## Configuración y arranque

1. Inicie MySQL en XAMPP, en el puerto 3306.
2. Instale las dependencias desde esta carpeta con npm ci.
3. Si todavía no existe .env, copie .env.example como .env y complete DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD.
4. La cuenta clientes_user debe existir en MySQL con la misma contraseña del .env y permisos SELECT, INSERT, UPDATE y DELETE sobre clientes_db.*. Escribir la cuenta en .env no la crea en el servidor.
5. Importe db/schema.sql con una cuenta administradora. El archivo crea la base y la tabla sin borrar datos. Incluye tres registros iniciales y permite volver a ejecutarlo.

En la consola de MySQL, el comando para importar desde este equipo es:

```sql
SOURCE C:/Users/USER/OneDrive/Escritorio/LogiRed-Nocturno-G4/ms-clientes/db/schema.sql;
```

Desde la carpeta del servicio:

```powershell
npm run dev
```

También puede usar npm start. Puerto HTTP predeterminado: 3002. Al iniciar se comprueba la conexión a la base; si falla, la consola indica el código y el servidor no comienza a escuchar.

Los datos se guardan en MySQL y permanecen después de reiniciar. Los registros creados anteriormente en memoria no se recuperan automáticamente. Cada servicio accede únicamente a su base.

## Operaciones disponibles

| Método | Ruta | Resultado |
|---|---|---|
| GET | /health | 200, identifica el servicio; no consulta la base |
| GET | /clientes | 200, listado ordenado por id |
| GET | /clientes/:id | 200, registro; 404 si no existe |
| POST | /clientes | 201, registro creado y cabecera Location |
| PUT | /clientes/:id | 200, registro actualizado; 404 si no existe |
| DELETE | /clientes/:id | 204 sin cuerpo; 404 si no existe |

POST y PUT reciben los campos editables completos. Se rechazan campos desconocidos, arreglos y campos obligatorios vacíos. Un id, filtro o cuerpo inválido devuelve 400. Un duplicado devuelve 409. PUT con los mismos valores devuelve 200.

## Reglas y filtros

Campos obligatorios: nombre (máximo 150), documento (30), telefono (32), email (254) y ciudad (100). Se recortan espacios; documento se guarda en mayúsculas y email en minúsculas. El teléfono admite entre 7 y 15 dígitos y separadores habituales. Documento y email son únicos; la base impide duplicados incluso entre solicitudes simultáneas.

Ejemplo de filtro: GET /clientes?ciudad=Cali

Los filtros se pueden combinar. GET /clientes?ids=1,3,8 devuelve los ids existentes en un lote, elimina repeticiones y omite ids inexistentes. Un lote sin coincidencias devuelve []. Los ids deben ser enteros positivos en formato decimal.

## Ejemplo de creación

POST http://localhost:3002/clientes

```json
{
  "nombre": "Comercializadora del Pacífico",
  "documento": "900555123-4",
  "telefono": "+573001234567",
  "email": "contacto@pacifico.example",
  "ciudad": "Cali"
}
```

Para modificar, use PUT http://localhost:3002/clientes/4 con el cuerpo completo del registro. Para consultar, use GET con el id devuelto por POST.

## Archivos principales

- src/db.js: conexión a la base propia.
- db/schema.sql: creación de base, tabla, restricciones y datos iniciales.
- src/routes/clientes.routes.js: direcciones y métodos HTTP.
- src/controllers/clientes.controller.js: lectura de ids y filtros, y respuestas HTTP.
- src/services/clientes.service.js: validaciones y reglas.
- src/models/cliente.js: campos y normalización.
- src/repositories/clientes.repository.js: consultas SQL con parámetros.
