import { Pool } from "mysql2/promise";
import { Dish } from "../../../Domain/Dishes/Dish";
import { DishRepository } from "../../../Domain/Dishes/Repositories/DishRepository";
import { getPool } from "../../../../Core/Infraestructure/Database/connection";

interface DishRow {
  id: string;
  name: string;
  description: string | null;
  calories: number;
  image: string | null;
  created_by: string;
  created_at: Date | string;
}

function rowToDish(row: DishRow): Dish {
  return Dish.create({
    id: row.id,
    name: row.name,
    description: row.description,
    calories: Number(row.calories),
    image: row.image,
    createdBy: row.created_by,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
  });
}

export class DishRepositoryMySQL implements DishRepository {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  async create(dish: Dish): Promise<Dish> {
    const [result] = await this.pool.execute(
      `INSERT INTO dishes (id, name, description, calories, image, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dish.id,
        dish.name,
        dish.description,
        dish.calories,
        dish.image,
        dish.createdBy,
        dish.createdAt,
      ]
    );
    return dish;
  }

  async findById(id: string): Promise<Dish | null> {
    const [rows] = await this.pool.execute(
      "SELECT * FROM dishes WHERE id = ?",
      [id]
    );
    const dishRows = rows as DishRow[];
    if (dishRows.length === 0) return null;
    return rowToDish(dishRows[0]);
  }

  async findAll(userId: string): Promise<Dish[]> {
    const [rows] = await this.pool.execute(
      "SELECT * FROM dishes WHERE created_by = ? ORDER BY created_at DESC",
      [userId]
    );
    const dishRows = rows as DishRow[];
    return dishRows.map(rowToDish);
  }

  async update(dish: Dish): Promise<Dish> {
    await this.pool.execute(
      `UPDATE dishes SET name = ?, description = ?, calories = ?, image = ? WHERE id = ? AND created_by = ?`,
      [dish.name, dish.description, dish.calories, dish.image, dish.id, dish.createdBy]
    );
    return dish;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const [result] = await this.pool.execute(
      "DELETE FROM dishes WHERE id = ? AND created_by = ?",
      [id, userId]
    );
    const affected = (result as any).affectedRows;
    return affected > 0;
  }

  async getRandomDish(userId: string): Promise<Dish | null> {
    const [rows] = await this.pool.execute(
      "SELECT * FROM dishes WHERE created_by = ? ORDER BY RAND() LIMIT 1",
      [userId]
    );
    const dishRows = rows as DishRow[];
    if (dishRows.length === 0) return null;
    return rowToDish(dishRows[0]);
  }
}
