"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngredientRepositoryMySQL = void 0;
const Ingredients_1 = require("src/Planner/Domain/Entities/Ingredients");
const connection_1 = require("src/Core/Infraestructure/Database/connection");
function rowToIngredient(row) {
    return Ingredients_1.Ingredients.create({
        id: row.id,
        name: row.name,
        caloriesPer100g: Number(row.calories_per_100g),
        createdBy: row.created_by,
        createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    });
}
class IngredientRepositoryMySQL {
    constructor(pool) {
        this.pool = pool ?? (0, connection_1.getPool)();
    }
    async create(ingredient) {
        await this.pool.execute(`INSERT INTO ingredients (id, name, calories_per_100g, created_by, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         calories_per_100g = VALUES(calories_per_100g)`, [
            ingredient.id,
            ingredient.name,
            ingredient.caloriesPer100g,
            ingredient.createdBy,
            ingredient.createdAt,
        ]);
        return ingredient;
    }
    async findById(id) {
        const [rows] = await this.pool.execute("SELECT id, name, calories_per_100g, created_by, created_at FROM ingredients WHERE id = ?", [id]);
        const row = (Array.isArray(rows) ? rows[0] : rows?.[0]);
        if (!row)
            return null;
        return rowToIngredient(row);
    }
    async findAll() {
        const [rows] = await this.pool.execute("SELECT id, name, calories_per_100g, created_by, created_at FROM ingredients ORDER BY name");
        const list = (Array.isArray(rows) ? rows : []);
        return list.map(rowToIngredient);
    }
    async findByUser(userId) {
        const [rows] = await this.pool.execute("SELECT id, name, calories_per_100g, created_by, created_at FROM ingredients WHERE created_by = ? ORDER BY name", [userId]);
        const list = (Array.isArray(rows) ? rows : []);
        return list.map(rowToIngredient);
    }
    async delete(id) {
        const [result] = await this.pool.execute("DELETE FROM ingredients WHERE id = ?", [id]);
        const affected = result.affectedRows ?? 0;
        return affected > 0;
    }
}
exports.IngredientRepositoryMySQL = IngredientRepositoryMySQL;
