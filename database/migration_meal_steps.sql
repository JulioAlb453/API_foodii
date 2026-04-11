-- Ejecutar sobre una base foodii_db ya existente (p. ej. mysql -u root -p foodii_db < database/migration_meal_steps.sql)

USE foodii_db;

CREATE TABLE IF NOT EXISTS meal_steps (
  meal_id     VARCHAR(36)   NOT NULL,
  step_order  SMALLINT UNSIGNED NOT NULL,
  description TEXT          NOT NULL,
  PRIMARY KEY (meal_id, step_order),
  CONSTRAINT fk_meal_steps_meal
    FOREIGN KEY (meal_id) REFERENCES meals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
