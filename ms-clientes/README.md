# ms-clientes · Taller 1

Microservicio de clientes comerciales de LogiRed. Usa Node.js 22 o superior y Express, con controlador, servicio, modelo y repositorio.

## Alcance actual

Implementa listado, consulta por id y creación. Los datos son propios y se guardan en memoria; se pierden al reiniciar. Puerto predeterminado: 3002.


## Entidad y validaciones

Campos: `id, nombre, documento, telefono, email, ciudad`. El servidor asigna id.

Todos los campos del cuerpo son obligatorios. Se recortan espacios y se rechazan textos vacíos, arreglos y campos desconocidos.

| Campo | Regla |
|---|---|
| nombre | Texto de hasta 150 caracteres |
| documento | Texto de hasta 30 caracteres; letras, números y guiones; conserva ceros iniciales y se guarda en mayúsculas |
| telefono | Texto de hasta 32 caracteres con entre 7 y 15 dígitos; admite + inicial, espacios, paréntesis y guiones |
| email | Formato de correo válido, hasta 254 caracteres; se guarda en minúsculas |
| ciudad | Texto de hasta 100 caracteres |

Documento y email son únicos después de normalizarlos. Los duplicados devuelven 409.

## Ejecutar

Desde esta carpeta:

```CMD
npm ci
Copy-Item .env.example .env
npm start o npm run dev
```

Si ya tiene .env, conserve ese archivo y ajuste PORT y HOST según su equipo.
