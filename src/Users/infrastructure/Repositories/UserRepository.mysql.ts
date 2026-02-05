import { Pool } from "mysql2/promise";
import { User } from "src/Users/Domain/Entities/User";
import { UserRepository } from "src/Users/Domain/Interfaces/UserRepository";
import { getPool } from "src/Core/Infraestructure/Database/connection";

interface UserRow {
  id: string;
  username: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

function rowToUser(row: UserRow): User {
  return User.create({
    id: row.id,
    username: row.username,
    password: row.password,
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
    await this.pool.execute(
      `INSERT INTO users (id, username, password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         password = VALUES(password),
         updated_at = VALUES(updated_at)`,
      [
        user.id,
        user.username,
        user.password,
        user.createdAt,
        user.updatedAt,
      ]
    );
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [rows] = await this.pool.execute(
      "SELECT id, username, password, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );
    const row = (Array.isArray(rows) ? rows[0] : (rows as any)?.[0]) as UserRow | undefined;
    if (!row) return null;
    return rowToUser(row);
  }

  async findByUsername(username: string): Promise<User | null> {
    const normalized = username.toLowerCase().trim();
    const [rows] = await this.pool.execute(
      "SELECT id, username, password, created_at, updated_at FROM users WHERE LOWER(TRIM(username)) = ?",
      [normalized]
    );
    const row = (Array.isArray(rows) ? rows[0] : (rows as any)?.[0]) as UserRow | undefined;
    if (!row) return null;
    return rowToUser(row);
  }
}
