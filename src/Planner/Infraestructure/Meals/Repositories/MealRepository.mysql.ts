import { Pool } from "mysql2/promise";
import { Meal } from "src/Planner/Domain/Entities/Meal";
import { MealRepository } from "src/Planner/Domain/interfaces/MealRepository";
import { getPool } from "src/Core/Infraestructure/Database/connection";
import { IMealIngredient } from "src/Planner/Domain/interfaces/IMealIngredient";
import { IMealStep } from "src/Planner/Domain/interfaces/IMealStep";

/** Subconsulta: slugs ordenados, separados por coma (se parsea a string[] en Node). Sin JOIN principal → no afecta `image`. */
const CATEGORY_SLUGS_SUBQUERY = `(SELECT GROUP_CONCAT(mc.category_slug ORDER BY mc.category_slug SEPARATOR ',')
   FROM meal_categories mc WHERE mc.meal_id = m.id) AS category_slugs`;

/**
 * Columnas devueltas por los SELECT de comidas.
 * `meal_image`: alias explícito de `m.image` para evitar sombras/conflictos de nombre en el driver
 * cuando el SELECT incluye subconsultas agregadas (regresión típica: image llegaba null/undefined).
 */
interface MealRow {
  id: string;
  name: string;
  date: Date;
  meal_time: string;
  created_by: string;
  created_at: Date;
  total_calories: number;
  meal_image: string | null;
  category_slugs: string | null;
}

interface MealIngredientRow {
  ingredient_id: string;
  amount: number;
}

interface MealStepRow {
  meal_id: string;
  step_order: number;
  description: string;
}

function parseCategorySlugsFromRow(raw: unknown): string[] {
  if (raw == null || raw === "") return [];
  const s = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);
  return s
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

/** URL o ruta de imagen; null si vacío. Soporta Buffer (mysql2 según tipo/collation). */
function parseImageFromRow(row: MealRow & Record<string, unknown>): string | null {
  const raw =
    row.meal_image ??
    row.image ??
    row["m.image"] ??
    (typeof row.IMAGE === "string" ? row.IMAGE : undefined);
  if (raw == null || raw === "") return null;
  if (Buffer.isBuffer(raw)) {
    const s = raw.toString("utf8").trim();
    return s.length ? s : null;
  }
  const s = String(raw).trim();
  return s.length ? s : null;
}

function rowToMeal(
  row: MealRow,
  ingredients: IMealIngredient[],
  steps: IMealStep[],
): Meal {
  return Meal.create({
    id: row.id,
    name: row.name,
    date: row.date instanceof Date ? row.date : new Date(row.date),
    mealTime: row.meal_time,
    ingredients,
    steps,
    categories: parseCategorySlugsFromRow(row.category_slugs),
    CreatedBy: row.created_by,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    totalCalories: Number(row.total_calories),
    image: parseImageFromRow(row as MealRow & Record<string, unknown>),
  });
}

/** Lista de columnas base de `meals` + categorías (siempre mismo orden para todos los SELECT). */
const MEAL_BASE_SELECT = `m.id, m.name, m.date, m.meal_time, m.created_by, m.created_at, m.total_calories,
       m.image AS meal_image,
       ${CATEGORY_SLUGS_SUBQUERY}`;

export class MealRepositoryMySQL implements MealRepository {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  async create(meal: Meal): Promise<Meal> {
    const conn = await this.pool.getConnection();
    try {
      await conn.execute(
        `INSERT INTO meals (id, name, date, meal_time, created_by, created_at, total_calories, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           date = VALUES(date),
           meal_time = VALUES(meal_time),
           total_calories = VALUES(total_calories),
           image = VALUES(image)`,
        [
          meal.id,
          meal.name,
          meal.date,
          meal.mealTime,
          meal.CreatedBy,
          meal.createdAt,
          meal.totalCalories,
          meal.image ?? null,
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

      await conn.execute("DELETE FROM meal_steps WHERE meal_id = ?", [meal.id]);
      for (const s of meal.steps) {
        await conn.execute(
          "INSERT INTO meal_steps (meal_id, step_order, description) VALUES (?, ?, ?)",
          [meal.id, s.stepOrder, s.description],
        );
      }

      await conn.execute("DELETE FROM meal_categories WHERE meal_id = ?", [
        meal.id,
      ]);
      for (const slug of meal.categories) {
        await conn.execute(
          "INSERT INTO meal_categories (meal_id, category_slug) VALUES (?, ?)",
          [meal.id, slug]
        );
      }

      return meal;
    } finally {
      conn.release();
    }
  }

  async findById(id: string): Promise<Meal | null> {
    const [mealRows] = await this.pool.execute(
      `SELECT ${MEAL_BASE_SELECT}
       FROM meals m WHERE m.id = ?`,
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

    const [stepRows] = await this.pool.execute(
      "SELECT meal_id, step_order, description FROM meal_steps WHERE meal_id = ? ORDER BY step_order",
      [id],
    );
    const steps = this.rowsToSteps(
      (Array.isArray(stepRows) ? stepRows : []) as MealStepRow[],
    );

    return rowToMeal(mealRow, ingredients, steps);
  }

  async findAll(): Promise<Meal[]> {
    const [mealRows] = await this.pool.execute(
      `SELECT ${MEAL_BASE_SELECT}
       FROM meals m ORDER BY m.date DESC, m.meal_time`
    );
    const list = (Array.isArray(mealRows) ? mealRows : []) as MealRow[];
    return this.hydrateMeals(list);
  }

  async findByDate(date: Date): Promise<Meal[]> {
    const dateStr = date.toISOString().slice(0, 10);
    const [mealRows] = await this.pool.execute(
      `SELECT ${MEAL_BASE_SELECT}
       FROM meals m WHERE m.date = ? ORDER BY m.meal_time`,
      [dateStr]
    );
    const list = (Array.isArray(mealRows) ? mealRows : []) as MealRow[];
    return this.hydrateMeals(list);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Meal[]> {
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);
    const [mealRows] = await this.pool.execute(
      `SELECT ${MEAL_BASE_SELECT}
       FROM meals m WHERE m.date >= ? AND m.date <= ? ORDER BY m.date DESC, m.meal_time`,
      [startStr, endStr]
    );
    const list = (Array.isArray(mealRows) ? mealRows : []) as MealRow[];
    return this.hydrateMeals(list);
  }

  async findByUserAndDate(userId: string, date: Date): Promise<Meal[]> {
    const dateStr = date.toISOString().slice(0, 10);
    const [mealRows] = await this.pool.execute(
      `SELECT ${MEAL_BASE_SELECT}
       FROM meals m WHERE m.created_by = ? AND m.date = ? ORDER BY m.meal_time`,
      [userId, dateStr]
    );
    const list = (Array.isArray(mealRows) ? mealRows : []) as MealRow[];
    return this.hydrateMeals(list);
  }

  async findByUser(userId: string): Promise<Meal[]> {
    const [mealRows] = await this.pool.execute(
      `SELECT ${MEAL_BASE_SELECT}
       FROM meals m WHERE m.created_by = ? ORDER BY m.date DESC, m.meal_time`,
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

    const [allStepRows] = await this.pool.execute(
      `SELECT meal_id, step_order, description FROM meal_steps WHERE meal_id IN (${placeholders}) ORDER BY meal_id, step_order`,
      ids,
    );
    const stepList = (Array.isArray(allStepRows) ? allStepRows : []) as MealStepRow[];
    const stepsByMealId = new Map<string, IMealStep[]>();
    for (const r of stepList) {
      if (!stepsByMealId.has(r.meal_id)) stepsByMealId.set(r.meal_id, []);
      stepsByMealId.get(r.meal_id)!.push({
        stepOrder: Number(r.step_order),
        description: r.description,
      });
    }

    return mealRows.map((row) =>
      rowToMeal(row, byMealId.get(row.id) ?? [], stepsByMealId.get(row.id) ?? [])
    );
  }

  private rowsToSteps(rows: MealStepRow[]): IMealStep[] {
    return rows.map((r) => ({
      stepOrder: Number(r.step_order),
      description: r.description,
    }));
  }

  async getRandomMeal(userId: string): Promise<Meal | null> {
    const [mealRows] = await this.pool.execute(
      `SELECT ${MEAL_BASE_SELECT}
       FROM meals m WHERE m.created_by = ? ORDER BY RAND() LIMIT 1`,
      [userId]
    );
    const list = (Array.isArray(mealRows) ? mealRows : []) as MealRow[];
    if (list.length === 0) return null;
    const meals = await this.hydrateMeals(list);
    return meals[0];
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
