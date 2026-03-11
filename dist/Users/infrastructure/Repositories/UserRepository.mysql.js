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
        createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
        updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
    });
}
class UserRepositoryMySQL {
    constructor(pool) {
        this.pool = pool ?? (0, connection_1.getPool)();
    }
    async create(user) {
        await this.pool.execute(`INSERT INTO users (id, username, password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         password = VALUES(password),
         updated_at = VALUES(updated_at)`, [
            user.id,
            user.username,
            user.password,
            user.createdAt,
            user.updatedAt,
        ]);
        return user;
    }
    async findById(id) {
        const [rows] = await this.pool.execute("SELECT id, username, password, created_at, updated_at FROM users WHERE id = ?", [id]);
        const row = (Array.isArray(rows) ? rows[0] : rows?.[0]);
        if (!row)
            return null;
        return rowToUser(row);
    }
    async findByUsername(username) {
        const normalized = username.toLowerCase().trim();
        const [rows] = await this.pool.execute("SELECT id, username, password, created_at, updated_at FROM users WHERE LOWER(TRIM(username)) = ?", [normalized]);
        const row = (Array.isArray(rows) ? rows[0] : rows?.[0]);
        if (!row)
            return null;
        return rowToUser(row);
    }
}
exports.UserRepositoryMySQL = UserRepositoryMySQL;
