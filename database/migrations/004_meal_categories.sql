-- Categorías (slugs) asociadas a cada comida para listados, FCM y filtros.
USE foodii_db;

CREATE TABLE IF NOT EXISTS meal_categories (
  meal_id        VARCHAR(36)  NOT NULL,
  category_slug  VARCHAR(64)  NOT NULL,
  PRIMARY KEY (meal_id, category_slug),
  KEY idx_meal_categories_slug (category_slug),
  CONSTRAINT fk_meal_categories_meal
    FOREIGN KEY (meal_id) REFERENCES meals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
