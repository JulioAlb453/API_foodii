import { Pool } from "mysql2/promise";
import { Ingredients } from "src/Planner/Domain/Entities/Ingredients";
import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { getPool } from "src/Core/Infraestructure/Database/connection";

interface IngredientRow {
  id: string;
  name: string;
  calories_per_100g: number;
  created_by: string;
  created_at: Date;
}

function rowToIngredient(row: IngredientRow): Ingredients {
  return Ingredients.create({
    id: row.id,
    name: row.name,
    caloriesPer100g: Number(row.calories_per_100g),
    createdBy: row.created_by,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
  });
}

export class IngredientRepositoryMySQL implements IngredientRepository {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  async create(ingredient: Ingredients): Promise<Ingredients> {
    await this.pool.execute(
      `INSERT INTO ingredients (id, name, calories_per_100g, created_by, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         calories_per_100g = VALUES(calories_per_100g)`,
      [
        ingredient.id,
        ingredient.name,
        ingredient.caloriesPer100g,
        ingredient.createdBy,
        ingredient.createdAt,
      ]
    );
    return ingredient;
  }

  async findById(id: string): Promise<Ingredients | null> {
    const [rows] = await this.pool.execute(
      "SELECT id, name, calories_per_100g, created_by, created_at FROM ingredients WHERE id = ?",
      [id]
    );
    const row = (Array.isArray(rows) ? rows[0] : (rows as any)?.[0]) as IngredientRow | undefined;
    if (!row) return null;
    return rowToIngredient(row);
  }

  async findByUser(userId: string): Promise<Ingredients[]> {
    const [rows] = await this.pool.execute(
      "SELECT id, name, calories_per_100g, created_by, created_at FROM ingredients WHERE created_by = ? ORDER BY name",
      [userId]
    );
    const list = (Array.isArray(rows) ? rows : []) as IngredientRow[];
    return list.map(rowToIngredient);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const [result] = await this.pool.execute(
      "DELETE FROM ingredients WHERE id = ? AND created_by = ?",
      [id, userId]
    );
    const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
    return affected > 0;
  }
}
