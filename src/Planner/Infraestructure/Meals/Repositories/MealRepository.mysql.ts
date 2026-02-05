import { Pool } from "mysql2/promise";
import { Meal } from "src/Planner/Domain/Entities/Meal";
import { MealRepository } from "src/Planner/Domain/interfaces/MealRepository";
import { getPool } from "src/Core/Infraestructure/Database/connection";
import { IMealIngredient } from "src/Planner/Domain/interfaces/IMealIngredient";

interface MealRow {
  id: string;
  name: string;
  date: Date;
  meal_time: string;
  created_by: string;
  created_at: Date;
  total_calories: number;
}

interface MealIngredientRow {
  ingredient_id: string;
  amount: number;
}

function rowToMeal(row: MealRow, ingredients: IMealIngredient[]): Meal {
  return Meal.create({
    id: row.id,
    name: row.name,
    date: row.date instanceof Date ? row.date : new Date(row.date),
    mealTime: row.meal_time,
    ingredients,
    CreatedBy: row.created_by,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    totalCalories: Number(row.total_calories),
  });
}

export class MealRepositoryMySQL implements MealRepository {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  async create(meal: Meal): Promise<Meal> {
    const conn = await this.pool.getConnection();
    try {
      await conn.execute(
        `INSERT INTO meals (id, name, date, meal_time, created_by, created_at, total_calories)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           date = VALUES(date),
           meal_time = VALUES(meal_time),
           total_calories = VALUES(total_calories)`,
        [
          meal.id,
          meal.name,
          meal.date,
          meal.mealTime,
          meal.CreatedBy,
          meal.createdAt,
          meal.totalCalories,
        ]
      );

      await conn.execute("DELETE FROM meal_ingredients WHERE meal_id = ?", [
        meal.id,
      ]);

      for (const ing of meal.ingredients) {
        await conn.execute(
          "INSERT INTO meal_ingredients (meal_id, ingredient_id, amount) VALUES (?, ?, ?)",
          [meal.id, ing.ingredientId, ing.amount]
        );
      }

      return meal;
    } finally {
      conn.release();
    }
  }

  async findById(id: string): Promise<Meal | null> {
    const [mealRows] = await this.pool.execute(
      "SELECT id, name, date, meal_time, created_by, created_at, total_calories FROM meals WHERE id = ?",
      [id]
    );
    const mealRow = (Array.isArray(mealRows) ? mealRows[0] : (mealRows as any)?.[0]) as MealRow | undefined;
    if (!mealRow) return null;

    const [ingRows] = await this.pool.execute(
      "SELECT ingredient_id, amount FROM meal_ingredients WHERE meal_id = ?",
      [id]
    );
    const ingList = (Array.isArray(ingRows) ? ingRows : []) as MealIngredientRow[];
    const ingredients: IMealIngredient[] = ingList.map((r) => ({
      ingredientId: r.ingredient_id,
      amount: Number(r.amount),
    }));

    return rowToMeal(mealRow, ingredients);
  }

  async findAll(): Promise<Meal[]> {
    const [mealRows] = await this.pool.execute(
      `SELECT id, name, date, meal_time, created_by, created_at, total_calories
       FROM meals ORDER BY date DESC, meal_time`
    );
    const list = (Array.isArray(mealRows) ? mealRows : []) as MealRow[];
    return this.hydrateMeals(list);
  }

  async findByDate(date: Date): Promise<Meal[]> {
    const dateStr = date.toISOString().slice(0, 10);
    const [mealRows] = await this.pool.execute(
      `SELECT id, name, date, meal_time, created_by, created_at, total_calories
       FROM meals WHERE date = ? ORDER BY meal_time`,
      [dateStr]
    );
    const list = (Array.isArray(mealRows) ? mealRows : []) as MealRow[];
    return this.hydrateMeals(list);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Meal[]> {
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);
    const [mealRows] = await this.pool.execute(
      `SELECT id, name, date, meal_time, created_by, created_at, total_calories
       FROM meals WHERE date >= ? AND date <= ? ORDER BY date DESC, meal_time`,
      [startStr, endStr]
    );
    const list = (Array.isArray(mealRows) ? mealRows : []) as MealRow[];
    return this.hydrateMeals(list);
  }

  async findByUserAndDate(userId: string, date: Date): Promise<Meal[]> {
    const dateStr = date.toISOString().slice(0, 10);
    const [mealRows] = await this.pool.execute(
      `SELECT id, name, date, meal_time, created_by, created_at, total_calories
       FROM meals WHERE created_by = ? AND date = ? ORDER BY meal_time`,
      [userId, dateStr]
    );
    const list = (Array.isArray(mealRows) ? mealRows : []) as MealRow[];
    return this.hydrateMeals(list);
  }

  async findByUser(userId: string): Promise<Meal[]> {
    const [mealRows] = await this.pool.execute(
      `SELECT id, name, date, meal_time, created_by, created_at, total_calories
       FROM meals WHERE created_by = ? ORDER BY date DESC, meal_time`,
      [userId]
    );
    const list = (Array.isArray(mealRows) ? mealRows : []) as MealRow[];
    return this.hydrateMeals(list);
  }

  private async hydrateMeals(mealRows: MealRow[]): Promise<Meal[]> {
    if (mealRows.length === 0) return [];

    const ids = mealRows.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");
    const [ingRows] = await this.pool.execute(
      `SELECT meal_id, ingredient_id, amount FROM meal_ingredients WHERE meal_id IN (${placeholders})`,
      ids
    );
    interface Row extends MealIngredientRow {
      meal_id: string;
    }
    const ingList = (Array.isArray(ingRows) ? ingRows : []) as Row[];
    const byMealId = new Map<string, IMealIngredient[]>();
    for (const r of ingList) {
      const mealId = r.meal_id;
      if (!byMealId.has(mealId)) byMealId.set(mealId, []);
      byMealId.get(mealId)!.push({
        ingredientId: r.ingredient_id,
        amount: Number(r.amount),
      });
    }

    return mealRows.map((row) =>
      rowToMeal(row, byMealId.get(row.id) ?? [])
    );
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const [result] = await this.pool.execute(
      "DELETE FROM meals WHERE id = ? AND created_by = ?",
      [id, userId]
    );
    const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
    return affected > 0;
  }
}
