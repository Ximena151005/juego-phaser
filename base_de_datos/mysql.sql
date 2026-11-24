-- Forest Dash · base de datos para MySQL 8 / MariaDB 10.4+
-- Puedes importarlo en phpMyAdmin, MySQL Workbench o con:  mysql -u root -p < database/mysql.sql
-- (también lo ejecuta `npm run setup`)

CREATE DATABASE IF NOT EXISTS forest_dash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE forest_dash;

-- Un registro por jugador (el alias es único; "Ana" y "ana" cuentan como el mismo)
CREATE TABLE IF NOT EXISTS jugadores (
  id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  alias   VARCHAR(12) NOT NULL,
  creado  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_jugadores_alias (alias),
  CONSTRAINT ck_jugadores_alias CHECK (CHAR_LENGTH(alias) BETWEEN 3 AND 12)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cada partida terminada
CREATE TABLE IF NOT EXISTS partidas (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  jugador_id  BIGINT UNSIGNED NOT NULL,
  puntuacion  INT UNSIGNED NOT NULL,
  nivel       TINYINT UNSIGNED NOT NULL,
  creada      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_partidas_jugador (jugador_id),
  KEY ix_partidas_puntuacion (puntuacion),
  CONSTRAINT fk_partidas_jugador FOREIGN KEY (jugador_id) REFERENCES jugadores (id),
  CONSTRAINT ck_partidas_puntuacion CHECK (puntuacion BETWEEN 0 AND 100000),
  CONSTRAINT ck_partidas_nivel CHECK (nivel BETWEEN 1 AND 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Top 10: la mejor puntuación de cada jugador (en empate gana quien la logró antes)
CREATE OR REPLACE VIEW ranking_top10 AS
  SELECT j.alias AS alias, MAX(p.puntuacion) AS puntos
  FROM partidas p
  JOIN jugadores j ON j.id = p.jugador_id
  GROUP BY j.alias
  ORDER BY puntos DESC, MIN(p.creada) ASC
  LIMIT 10;

-- Recomendado en producción: un usuario propio con permisos mínimos para la API.
-- Quita los "--", cambia la contraseña y pon ese usuario en el archivo .env
-- CREATE USER 'forest_app'@'localhost' IDENTIFIED BY 'CAMBIA_ESTA_CLAVE';
-- GRANT SELECT, INSERT, UPDATE ON forest_dash.jugadores TO 'forest_app'@'localhost';
-- GRANT INSERT ON forest_dash.partidas TO 'forest_app'@'localhost';
-- GRANT SELECT ON forest_dash.ranking_top10 TO 'forest_app'@'localhost';
-- FLUSH PRIVILEGES;
