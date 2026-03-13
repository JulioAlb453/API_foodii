"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MealRepositoryMySQL = void 0;
const Meal_1 = require("src/Planner/Domain/Entities/Meal");
const connection_1 = require("src/Core/Infraestructure/Database/connection");
function rowToMeal(row, ingredients) {
    return Meal_1.Meal.create({
        id: row.id,
        name: row.name,
        date: row.date instanceof Date ? row.date : new Date(row.date),
        mealTime: row.meal_time,
        ingredients,
        CreatedBy: row.created_by,
        createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
        totalCalories: Number(row.total_calories),
        image: row.image ?? null,
    });
}
class MealRepositoryMySQL {
    constructor(pool) {
        this.pool = pool ?? (0, connection_1.getPool)();
    }
    async create(meal) {
        const conn = await this.pool.getConnection();
        try {
            await conn.execute(`INSERT INTO meals (id, name, date, meal_time, created_by, created_at, total_calories, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           date = VALUES(date),
           meal_time = VALUES(meal_time),
           total_calories = VALUES(total_calories),
           image = VALUES(image)`, [
                meal.id,
                meal.name,
                meal.date,
                meal.mealTime,
                meal.CreatedBy,
                meal.createdAt,
                meal.totalCalories,
                meal.image ?? null,
            ]);
            await conn.execute("DELETE FROM meal_ingredients WHERE meal_id = ?", [
                meal.id,
            ]);
            for (const ing of meal.ingredients) {
                await conn.execute("INSERT INTO meal_ingredients (meal_id, ingredient_id, amount) VALUES (?, ?, ?)", [meal.id, ing.ingredientId, ing.amount]);
            }
            return meal;
        }
        finally {
            conn.release();
        }
    }
    async findById(id) {
        const [mealRows] = await this.pool.execute("SELECT id, name, date, meal_time, created_by, created_at, total_calories, image FROM meals WHERE id = ?", [id]);
        const mealRow = (Array.isArray(mealRows) ? mealRows[0] : mealRows?.[0]);
        if (!mealRow)
            return null;
        const [ingRows] = await this.pool.execute("SELECT ingredient_id, amount FROM meal_ingredients WHERE meal_id = ?", [id]);
        const ingList = (Array.isArray(ingRows) ? ingRows : []);
        const ingredients = ingList.map((r) => ({
            ingredientId: r.ingredient_id,
            amount: Number(r.amount),
        }));
        return rowToMeal(mealRow, ingredients);
    }
    async findAll() {
        const [mealRows] = await this.pool.execute(`SELECT id, name, date, meal_time, created_by, created_at, total_calories, image
       FROM meals ORDER BY date DESC, meal_time`);
        const list = (Array.isArray(mealRows) ? mealRows : []);
        return this.hydrateMeals(list);
    }
    async findByDate(date) {
        const dateStr = date.toISOString().slice(0, 10);
        const [mealRows] = await this.pool.execute(`SELECT id, name, date, meal_time, created_by, created_at, total_calories, image
       FROM meals WHERE date = ? ORDER BY meal_time`, [dateStr]);
        const list = (Array.isArray(mealRows) ? mealRows : []);
        return this.hydrateMeals(list);
    }
    async findByDateRange(startDate, endDate) {
        const startStr = startDate.toISOString().slice(0, 10);
        const endStr = endDate.toISOString().slice(0, 10);
        const [mealRows] = await this.pool.execute(`SELECT id, name, date, meal_time, created_by, created_at, total_calories, image
       FROM meals WHERE date >= ? AND date <= ? ORDER BY date DESC, meal_time`, [startStr, endStr]);
        const list = (Array.isArray(mealRows) ? mealRows : []);
        return this.hydrateMeals(list);
    }
    async findByUserAndDate(userId, date) {
        const dateStr = date.toISOString().slice(0, 10);
        const [mealRows] = await this.pool.execute(`SELECT id, name, date, meal_time, created_by, created_at, total_calories, image
       FROM meals WHERE created_by = ? AND date = ? ORDER BY meal_time`, [userId, dateStr]);
        const list = (Array.isArray(mealRows) ? mealRows : []);
        return this.hydrateMeals(list);
    }
    async findByUser(userId) {
        const [mealRows] = await this.pool.execute(`SELECT id, name, date, meal_time, created_by, created_at, total_calories, image
       FROM meals WHERE created_by = ? ORDER BY date DESC, meal_time`, [userId]);
        const list = (Array.isArray(mealRows) ? mealRows : []);
        return this.hydrateMeals(list);
    }
    async hydrateMeals(mealRows) {
        if (mealRows.length === 0)
            return [];
        const ids = mealRows.map((r) => r.id);
        const placeholders = ids.map(() => "?").join(",");
        const [ingRows] = await this.pool.execute(`SELECT meal_id, ingredient_id, amount FROM meal_ingredients WHERE meal_id IN (${placeholders})`, ids);
        const ingList = (Array.isArray(ingRows) ? ingRows : []);
        const byMealId = new Map();
        for (const r of ingList) {
            const mealId = r.meal_id;
            if (!byMealId.has(mealId))
                byMealId.set(mealId, []);
            byMealId.get(mealId).push({
                ingredientId: r.ingredient_id,
                amount: Number(r.amount),
            });
        }
        return mealRows.map((row) => rowToMeal(row, byMealId.get(row.id) ?? []));
    }
    async delete(id, userId) {
        const [result] = await this.pool.execute("DELETE FROM meals WHERE id = ? AND created_by = ?", [id, userId]);
        const affected = result.affectedRows ?? 0;
        return affected > 0;
    }
}
exports.MealRepositoryMySQL = MealRepositoryMySQL;
