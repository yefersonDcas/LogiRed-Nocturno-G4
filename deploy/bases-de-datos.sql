-- =====================================================================
-- Bases de datos y usuarios en servidor1 (MySQL 8) · una base y un usuario por microservicio
-- Cada usuario solo puede conectarse desde servidor2 (172.16.0.181) y solo ve su propia base.
-- Reemplaza <CLAVE_...> por la clave real (están en taller3/secretos.txt, que NO se sube a git).
-- Ejecutar en servidor1:  sudo mysql < bases-de-datos.sql
-- Las tablas las crea cada microservicio con su db/schema.sql (lo hacen los scripts 2 y 6b).
-- =====================================================================
CREATE DATABASE IF NOT EXISTS usuarios_db    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS clientes_db    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS envios_db      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS conductores_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'usuarios_user'@'172.16.0.181'    IDENTIFIED BY '<CLAVE_USUARIOS>';
CREATE USER IF NOT EXISTS 'clientes_user'@'172.16.0.181'    IDENTIFIED BY '<CLAVE_CLIENTES>';
CREATE USER IF NOT EXISTS 'envios_user'@'172.16.0.181'      IDENTIFIED BY '<CLAVE_ENVIOS>';
CREATE USER IF NOT EXISTS 'conductores_user'@'172.16.0.181' IDENTIFIED BY '<CLAVE_CONDUCTORES>';

GRANT ALL PRIVILEGES ON usuarios_db.*    TO 'usuarios_user'@'172.16.0.181';
GRANT ALL PRIVILEGES ON clientes_db.*    TO 'clientes_user'@'172.16.0.181';
GRANT ALL PRIVILEGES ON envios_db.*      TO 'envios_user'@'172.16.0.181';
GRANT ALL PRIVILEGES ON conductores_db.* TO 'conductores_user'@'172.16.0.181';
FLUSH PRIVILEGES;
