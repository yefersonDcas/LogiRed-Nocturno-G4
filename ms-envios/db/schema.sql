CREATE DATABASE IF NOT EXISTS envios_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE envios_db;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS envios (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero_guia       VARCHAR(50)         NOT NULL,
  cliente_id        BIGINT UNSIGNED     NOT NULL,
  peso_kg DOUBLE    NOT NULL,
  ciudad_destino    VARCHAR(100)        NOT NULL,
  direccion_destino VARCHAR(200)        NOT NULL,
  estado            VARCHAR(20)         NOT NULL DEFAULT 'registrado',
  fecha_registro    DATETIME(3)         NOT NULL,

  CONSTRAINT uq_envios_numero_guia      UNIQUE (numero_guia),
  CONSTRAINT ck_envios_cliente_id       CHECK (cliente_id > 0 AND cliente_id <= 9007199254740991),
  CONSTRAINT ck_envios_peso             CHECK (peso_kg > 0),
  CONSTRAINT ck_envios_estado           CHECK (estado IN ('registrado', 'en_transito', 'entregado'))
);
-- cliente_id es una referencia externa; no tiene llave foránea hacia otra base.
-- La aplicación genera la guía y guarda fecha_registro en UTC.
