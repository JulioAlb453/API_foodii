import { Pool } from "mysql2/promise";
import { User } from "src/Users/Domain/Entities/User";
import { UserRepository } from "src/Users/Domain/Interfaces/UserRepository";
import { getPool } from "src/Core/Infraestructure/Database/connection";

interface UserRow {
  id: string;
  username: string;
  password: string;
  fcm_token: string | null;
  notification_category_preferences: unknown;
  created_at: Date;
  updated_at: Date;
}

function parseNotificationCategoryPreferences(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x)).filter((s) => s.length > 0);
  }
  if (Buffer.isBuffer(raw)) {
    raw = raw.toString("utf8");
  }
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p)
        ? p.map((x) => String(x)).filter((s) => s.length > 0)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

function rowToUser(row: UserRow): User {
  return User.create({
    id: row.id,
    username: row.username,
    password: row.password,
    fcmToken: row.fcm_token ?? null,
    notificationCategoryPreferences: parseNotificationCategoryPreferences(
      row.notification_category_preferences
    ),
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
  });
}

export class UserRepositoryMySQL implements UserRepository {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  async create(user: User): Promise<User> {
    const prefsJson =
      user.notificationCategoryPreferences != null &&
      user.notificationCategoryPreferences.length > 0
        ? JSON.stringify(user.notificationCategoryPreferences)
        : null;

    await this.pool.execute(
      `INSERT INTO users (id, username, password, fcm_token, notification_category_preferences, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         password = VALUES(password),
         fcm_token = VALUES(fcm_token),
         notification_category_preferences = VALUES(notification_category_preferences),
         updated_at = VALUES(updated_at)`,
      [
        user.id,
        user.username,
        user.password,
        user.fcmToken ?? null,
        prefsJson,
        user.createdAt,
        user.updatedAt,
      ]
    );
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [rows] = await this.pool.execute(
      "SELECT id, username, password, fcm_token, notification_category_preferences, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );
    const row = (Array.isArray(rows) ? rows[0] : (rows as any)?.[0]) as UserRow | undefined;
    if (!row) return null;
    return rowToUser(row);
  }

  async findByUsername(username: string): Promise<User | null> {
    const normalized = username.toLowerCase().trim();
    const [rows] = await this.pool.execute(
      "SELECT id, username, password, fcm_token, notification_category_preferences, created_at, updated_at FROM users WHERE LOWER(TRIM(username)) = ?",
      [normalized]
    );
    const row = (Array.isArray(rows) ? rows[0] : (rows as any)?.[0]) as UserRow | undefined;
    if (!row) return null;
    return rowToUser(row);
  }

  async assignFcmTokenExclusive(userId: string, fcmToken: string): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `UPDATE users SET fcm_token = NULL, updated_at = CURRENT_TIMESTAMP(3)
         WHERE fcm_token = ? AND id <> ?`,
        [fcmToken, userId]
      );
      await conn.execute(
        `UPDATE users SET fcm_token = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [fcmToken, userId]
      );
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
