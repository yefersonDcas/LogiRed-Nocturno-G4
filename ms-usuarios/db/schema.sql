SET NAMES utf8mb4;

CREATE TABLE usuarios (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100)    NOT NULL,
    email       VARCHAR(100)    NOT NULL UNIQUE,
    rol         VARCHAR(255)    NOT NULL,
    activo      BOOLEAN         NOT NULL DEFAULT TRUE
);

INSERT INTO usuarios (nombre, email, rol, activo) VALUES
('administrador General', 'admin@empresa.com', 'administrador', TRUE),
('Laura Gomez', 'laura.gomez@empresa.com', 'administrador', TRUE),
('Andrés Castillo', 'andres.castillo@empresa.com', 'administrador', FALSE);
