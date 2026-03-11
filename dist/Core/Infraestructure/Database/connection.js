"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConfig = void 0;
exports.getPool = getPool;
exports.closePool = closePool;
const promise_1 = __importDefault(require("mysql2/promise"));
const DB_HOST = process.env.DB_HOST ?? "localhost";
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER ?? "root";
const DB_PASSWORD = process.env.DB_PASSWORD ?? "";
const DB_NAME = process.env.DB_NAME ?? "foodii_db";
let pool = null;
function getPool() {
    if (!pool) {
        pool = promise_1.default.createPool({
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            charset: "utf8mb4",
        });
    }
    return pool;
}
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
exports.dbConfig = {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    database: DB_NAME,
};
