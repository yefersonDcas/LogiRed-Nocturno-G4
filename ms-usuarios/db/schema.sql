SET NAMES utf8mb4;

CREATE TABLE usuarios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL,
    email           VARCHAR(100)    NOT NULL UNIQUE,
    password_hash   VARCHAR(100)    NOT NULL,
    rol             VARCHAR(255)    NOT NULL,
    activo          BOOLEAN         NOT NULL DEFAULT TRUE
);

INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES
(
  'Administrador General',
  'admin@empresa.com',
  '$2b$12$zaJaN1cwgv6V/EVis/i.o.UQ1AhbjpqFmoOkTl0Bmvm9l0gqSpl0C',
  'administrador',
  TRUE
);
