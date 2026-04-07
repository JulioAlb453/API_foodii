USE foodii_db;

ALTER TABLE users
  ADD COLUMN notification_category_preferences JSON NULL
    AFTER fcm_token;
