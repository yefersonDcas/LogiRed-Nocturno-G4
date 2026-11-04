CREATE DATABASE IF NOT EXISTS conductores_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE conductores_db;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS conductores (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(150)      NOT NULL,
  cedula              VARCHAR(20)       NOT NULL,
  categoria_licencia  VARCHAR(2)        NOT NULL,
  telefono            VARCHAR(32)       NOT NULL,
  sede                VARCHAR(20)       NOT NULL,
  CONSTRAINT uq_conductores_cedula      UNIQUE (cedula),
  CONSTRAINT ck_conductores_categoria CHECK (categoria_licencia IN ('A1','A2','B1','B2','B3','C1','C2','C3')),
  CONSTRAINT ck_conductores_sede CHECK (sede IN ('Cali','Medellín','Bogotá'))
);

INSERT INTO conductores (nombre, cedula, categoria_licencia, telefono, sede)
SELECT 'Carlos Ramírez', '0012345678', 'C2', '+573001234567', 'Cali'
WHERE NOT EXISTS (SELECT 1 FROM conductores WHERE cedula = '0012345678');

INSERT INTO conductores (nombre, cedula, categoria_licencia, telefono, sede)
SELECT 'Diana López', '0098765432', 'C3', '+573102345678', 'Medellín'
WHERE NOT EXISTS (SELECT 1 FROM conductores WHERE cedula = '0098765432');

INSERT INTO conductores (nombre, cedula, categoria_licencia, telefono, sede)
SELECT 'Jorge Pérez', '0011223344', 'C1', '+573203456789', 'Bogotá'
WHERE NOT EXISTS (SELECT 1 FROM conductores WHERE cedula = '0011223344');
