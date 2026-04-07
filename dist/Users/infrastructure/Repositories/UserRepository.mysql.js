"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepositoryMySQL = void 0;
const User_1 = require("src/Users/Domain/Entities/User");
const connection_1 = require("src/Core/Infraestructure/Database/connection");
function rowToUser(row) {
    return User_1.User.create({
        id: row.id,
        username: row.username,
        password: row.password,
        fcmToken: row.fcm_token ?? null,
        createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
        updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
    });
}
class UserRepositoryMySQL {
    constructor(pool) {
        this.pool = pool ?? (0, connection_1.getPool)();
    }
    async create(user) {
        await this.pool.execute(`INSERT INTO users (id, username, password, fcm_token, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         password = VALUES(password),
         fcm_token = VALUES(fcm_token),
         updated_at = VALUES(updated_at)`, [
            user.id,
            user.username,
            user.password,
            user.fcmToken ?? null,
            user.createdAt,
            user.updatedAt,
        ]);
        return user;
    }
    async findById(id) {
        const [rows] = await this.pool.execute("SELECT id, username, password, fcm_token, created_at, updated_at FROM users WHERE id = ?", [id]);
        const row = (Array.isArray(rows) ? rows[0] : rows?.[0]);
        if (!row)
            return null;
        return rowToUser(row);
    }
    async findByUsername(username) {
        const normalized = username.toLowerCase().trim();
        const [rows] = await this.pool.execute("SELECT id, username, password, fcm_token, created_at, updated_at FROM users WHERE LOWER(TRIM(username)) = ?", [normalized]);
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
}
exports.UserRepositoryMySQL = UserRepositoryMySQL;
