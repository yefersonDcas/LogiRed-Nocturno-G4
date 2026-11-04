# ms-envios · MySQL

Microservicio de envios de LogiRed, organizado en rutas, controlador, servicio, modelo y repositorio. Usa Node.js 22 o superior, Express y mysql2, con una base propia: envios_db.

## Configuración y arranque

1. Inicie MySQL en XAMPP, en el puerto 3306.
2. Instale las dependencias desde esta carpeta con npm ci.
3. Si todavía no existe .env, copie .env.example como .env y complete DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD.
4. La cuenta envios_user debe existir en MySQL con la misma contraseña del .env y permisos SELECT, INSERT, UPDATE y DELETE sobre envios_db.*. Escribir la cuenta en .env no la crea en el servidor.
5. Importe db/schema.sql con una cuenta administradora. El archivo crea la base y la tabla sin borrar datos. La tabla comienza vacía.

En la consola de MySQL, el comando para importar desde este equipo es:

```sql
SOURCE C:/Users/USER/OneDrive/Escritorio/LogiRed-Nocturno-G4/ms-envios/db/schema.sql;
```

Desde la carpeta del servicio:

```powershell
npm run dev
```

También puede usar npm start. Puerto HTTP predeterminado: 3003. Al iniciar se comprueba la conexión a la base; si falla, la consola indica el código y el servidor no comienza a escuchar.

Los datos se guardan en MySQL y permanecen después de reiniciar. Los registros creados anteriormente en memoria no se recuperan automáticamente. Cada servicio accede únicamente a su base.

## Operaciones disponibles

| Método | Ruta | Resultado |
|---|---|---|
| GET | /health | 200, identifica el servicio; no consulta la base |
| GET | /envios | 200, listado ordenado por id |
| GET | /envios/:id | 200, registro; 404 si no existe |
| POST | /envios | 201, registro creado y cabecera Location |
| PUT | /envios/:id | 200, registro actualizado; 404 si no existe |
| DELETE | /envios/:id | 204 sin cuerpo; 404 si no existe |

POST y PUT reciben los campos editables completos. Se rechazan campos desconocidos, arreglos y campos obligatorios vacíos. Un id, filtro o cuerpo inválido devuelve 400. Un duplicado devuelve 409. PUT con los mismos valores devuelve 200.

## Reglas y filtros

Campos obligatorios: cliente_id (entero positivo), peso_kg (número finito mayor que cero), ciudad_destino (máximo 100) y direccion_destino (máximo 200).

estado admite registrado, en_transito o entregado. Si se omite en POST, se usa registrado. Si se omite en PUT, se conserva el estado actual. Se permite elegir cualquiera de los tres estados.

El servidor genera id, numero_guia y fecha_registro; esos campos se conservan al actualizar y no se aceptan en el cuerpo. La guía es única y la fecha se devuelve como ISO en UTC. El peso se guarda como DOUBLE para conservar valores positivos sin imponer una cantidad fija de decimales.

cliente_id solo guarda la referencia: todavía no se comprueba su existencia por REST ni se agrega un objeto cliente a la respuesta.

Ejemplos de filtros:
- GET /envios?estado=en_transito
- GET /envios?cliente_id=1
- GET /envios?ciudad_destino=Bogotá
- GET /envios?estado=registrado&cliente_id=1

Los filtros se pueden combinar. GET /envios?ids=1,3,8 devuelve los ids existentes en un lote, elimina repeticiones y omite ids inexistentes. Un lote sin coincidencias devuelve []. Los ids deben ser enteros positivos en formato decimal.

## Ejemplo de creación

POST http://localhost:3003/envios

```json
{
  "cliente_id": 1,
  "peso_kg": 2.5,
  "ciudad_destino": "Bogotá",
  "direccion_destino": "Calle 10 # 20-30",
  "estado": "en_transito"
}
```

Para modificar, use PUT http://localhost:3003/envios/4 con el cuerpo completo del registro. Para consultar, use GET con el id devuelto por POST.

## Archivos principales

- src/db.js: conexión a la base propia.
- db/schema.sql: creación de base, tabla, restricciones y configuración de columnas.
- src/routes/envios.routes.js: direcciones y métodos HTTP.
- src/controllers/envios.controller.js: lectura de ids y filtros, y respuestas HTTP.
- src/services/envios.service.js: validaciones y reglas.
- src/models/envio.js: campos y normalización.
- src/repositories/envios.repository.js: consultas SQL con parámetros.
