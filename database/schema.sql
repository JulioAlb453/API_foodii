
CREATE DATABASE IF NOT EXISTS foodii_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE foodii_db;

-- ---------------------------------------------
-- Tabla: users
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(36)  NOT NULL,
  username    VARCHAR(100) NOT NULL,
  password    VARCHAR(255) NOT NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- Tabla: ingredients
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ingredients (
  id                 VARCHAR(36)   NOT NULL,
  name               VARCHAR(200)  NOT NULL,
  calories_per_100g  DECIMAL(10,2) NOT NULL,
  created_by         VARCHAR(36)   NOT NULL,
  created_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_ingredients_created_by (created_by),
  CONSTRAINT fk_ingredients_created_by
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- Tabla: meals
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS meals (
  id             VARCHAR(36)   NOT NULL,
  name           VARCHAR(200)  NOT NULL,
  date           DATE          NOT NULL,
  meal_time      VARCHAR(20)   NOT NULL COMMENT 'breakfast, lunch, dinner, snack',
  created_by     VARCHAR(36)   NOT NULL,
  created_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  total_calories DECIMAL(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_meals_created_by (created_by),
  KEY idx_meals_date (date),
  KEY idx_meals_created_by_date (created_by, date),
  CONSTRAINT fk_meals_created_by
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_meals_meal_time
    CHECK (meal_time IN ('breakfast', 'lunch', 'dinner', 'snack'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- Tabla: meal_ingredients (relación N:M meals <-> ingredients con cantidad)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS meal_ingredients (
  meal_id       VARCHAR(36)   NOT NULL,
  ingredient_id VARCHAR(36)   NOT NULL,
  amount        DECIMAL(10,2) NOT NULL COMMENT 'cantidad en gramos',
  PRIMARY KEY (meal_id, ingredient_id),
  KEY idx_meal_ingredients_ingredient_id (ingredient_id),
  CONSTRAINT fk_meal_ingredients_meal
    FOREIGN KEY (meal_id) REFERENCES meals (id) ON DELETE CASCADE,
  CONSTRAINT fk_meal_ingredients_ingredient
    FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE RESTRICT,
  CONSTRAINT chk_meal_ingredients_amount
    CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- Índices adicionales para búsquedas
-- ---------------------------------------------
CREATE INDEX idx_ingredients_name ON ingredients (name(50));
CREATE INDEX idx_ingredients_created_by_name ON ingredients (created_by, name(50));
