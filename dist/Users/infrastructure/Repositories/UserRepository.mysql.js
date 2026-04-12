"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepositoryMySQL = void 0;
const User_1 = require("src/Users/Domain/Entities/User");
const connection_1 = require("src/Core/Infraestructure/Database/connection");
function parseNotificationCategoryPreferences(raw) {
    if (raw == null)
        return null;
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
        }
        catch {
            return null;
        }
    }
    return null;
}
function rowToUser(row) {
    return User_1.User.create({
        id: row.id,
        username: row.username,
        password: row.password,
        fcmToken: row.fcm_token ?? null,
        notificationCategoryPreferences: parseNotificationCategoryPreferences(row.notification_category_preferences),
        createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
        updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
    });
}
class UserRepositoryMySQL {
    constructor(pool) {
        this.pool = pool ?? (0, connection_1.getPool)();
    }
    async create(user) {
        const prefsJson = user.notificationCategoryPreferences != null &&
            user.notificationCategoryPreferences.length > 0
            ? JSON.stringify(user.notificationCategoryPreferences)
            : null;
        await this.pool.execute(`INSERT INTO users (id, username, password, fcm_token, notification_category_preferences, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         password = VALUES(password),
         fcm_token = VALUES(fcm_token),
         notification_category_preferences = VALUES(notification_category_preferences),
         updated_at = VALUES(updated_at)`, [
            user.id,
            user.username,
            user.password,
            user.fcmToken ?? null,
            prefsJson,
            user.createdAt,
            user.updatedAt,
        ]);
        return user;
    }
    async findById(id) {
        const [rows] = await this.pool.execute("SELECT id, username, password, fcm_token, notification_category_preferences, created_at, updated_at FROM users WHERE id = ?", [id]);
        const row = (Array.isArray(rows) ? rows[0] : rows?.[0]);
        if (!row)
            return null;
        return rowToUser(row);
    }
    async findByUsername(username) {
        const normalized = username.toLowerCase().trim();
        const [rows] = await this.pool.execute("SELECT id, username, password, fcm_token, notification_category_preferences, created_at, updated_at FROM users WHERE LOWER(TRIM(username)) = ?", [normalized]);
        const row = (Array.isArray(rows) ? rows[0] : rows?.[0]);
        if (!row)
            return null;
        return rowToUser(row);
    }
    async assignFcmTokenExclusive(userId, fcmToken) {
        const conn = await this.pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.execute(`UPDATE users SET fcm_token = NULL, updated_at = CURRENT_TIMESTAMP(3)
         WHERE fcm_token = ? AND id <> ?`, [fcmToken, userId]);
            await conn.execute(`UPDATE users SET fcm_token = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`, [fcmToken, userId]);
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }
    async updateNotificationPreferences(userId, categorySlugs, fcmToken) {
        const prefsJson = categorySlugs != null && categorySlugs.length > 0
            ? JSON.stringify(categorySlugs)
            : null;
        const conn = await this.pool.getConnection();
        try {
            await conn.beginTransaction();
            if (fcmToken !== undefined && fcmToken !== null) {
                await conn.execute(`UPDATE users SET fcm_token = NULL, updated_at = CURRENT_TIMESTAMP(3)
           WHERE fcm_token = ? AND id <> ?`, [fcmToken, userId]);
                await conn.execute(`UPDATE users SET notification_category_preferences = ?, fcm_token = ?, updated_at = CURRENT_TIMESTAMP(3)
           WHERE id = ?`, [prefsJson, fcmToken, userId]);
            }
            else if (fcmToken === null) {
                await conn.execute(`UPDATE users SET notification_category_preferences = ?, fcm_token = NULL, updated_at = CURRENT_TIMESTAMP(3)
           WHERE id = ?`, [prefsJson, userId]);
            }
            else {
                await conn.execute(`UPDATE users SET notification_category_preferences = ?, updated_at = CURRENT_TIMESTAMP(3)
           WHERE id = ?`, [prefsJson, userId]);
            }
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }
}
exports.UserRepositoryMySQL = UserRepositoryMySQL;
