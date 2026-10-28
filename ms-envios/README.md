# ms-envios · Taller 1

Microservicio de paquetes registrados para entrega en LogiRed. Usa Node.js 22 o superior y Express, con controlador, servicio, modelo y repositorio.

## Alcance actual

Implementa listado, consulta por id y creación. Guarda sus datos en memoria y comienza con una lista vacía. Los datos se pierden al reiniciar. Puerto predeterminado: 3003.


## Entidad y validaciones

Campos: `id, numero_guia, cliente_id, peso_kg, ciudad_destino, direccion_destino, estado, fecha_registro`.

El servidor genera id, número de guía único y fecha ISO en UTC. El estado inicial es registrado.

| Campo del cuerpo | Regla |
|---|---|
| cliente_id | Obligatorio; entero positivo dentro del rango seguro |
| peso_kg | Obligatorio; número finito mayor que cero, en kilogramos |
| ciudad_destino | Obligatorio; texto no vacío de hasta 100 caracteres |
| direccion_destino | Obligatorio; texto no vacío de hasta 200 caracteres |
| estado | Opcional; si se envía, debe ser registrado |

Se recortan espacios en ciudad y dirección. Se rechazan arreglos, campos desconocidos y números enviados como texto. No se pueden imponer id, numero_guia ni fecha_registro.

cliente_id es una referencia al cliente, no una copia de sus datos. En el Taller 1 solo se valida su formato: el servicio funciona de forma independiente y aún no comprueba que ese cliente exista en ms-clientes. Las respuestas actuales contienen los campos del envío, sin un objeto cliente agregado.

## Ejecutar

Desde esta carpeta:

```CMD
npm ci
Copy-Item .env.example .env
npm start o npm run dev
```

Ejemplo del cuerpo de POST:

```json
{
  "cliente_id": 1,
  "peso_kg": 2.5,
  "ciudad_destino": "Bogotá",
  "direccion_destino": "Calle 10 # 20-30"
}
```

El formato actual de numero_guia es LR- seguido de un identificador aleatorio único.
