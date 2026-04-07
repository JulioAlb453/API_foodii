USE foodii_db;

ALTER TABLE users
  ADD COLUMN fcm_token VARCHAR(500) NULL
   
    AFTER password;

CREATE INDEX idx_users_fcm_token ON users (fcm_token(191));
