CREATE DATABASE IF NOT EXISTS clientes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clientes_db;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS clientes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  documento VARCHAR(30) NOT NULL,
  telefono VARCHAR(32) NOT NULL,
  email VARCHAR(254) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  CONSTRAINT uq_clientes_documento UNIQUE (documento),
  CONSTRAINT uq_clientes_email UNIQUE (email)
);

-- Datos iniciales: repetir el archivo conserva los registros existentes.
INSERT INTO clientes (nombre, documento, telefono, email, ciudad)
SELECT 'Comercializadora del Valle', '900123456-7', '+573001234567', 'contacto@valle.example', 'Cali'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE documento = '900123456-7' OR email = 'contacto@valle.example');

INSERT INTO clientes (nombre, documento, telefono, email, ciudad)
SELECT 'Laura Gómez', '0012345678', '+573102345678', 'laura@example.com', 'Medellín'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE documento = '0012345678' OR email = 'laura@example.com');

INSERT INTO clientes (nombre, documento, telefono, email, ciudad)
SELECT 'Andrés Castillo', '0098765432', '+573203456789', 'andres@example.com', 'Bogotá'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE documento = '0098765432' OR email = 'andres@example.com');
