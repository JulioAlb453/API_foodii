"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngredientRepositories = void 0;
class IngredientRepositories {
    constructor() {
        this.ingredients = new Map();
    }
    async create(ingredients) {
        this.ingredients.set(ingredients.id, ingredients);
        return ingredients;
    }
    async findById(id) {
        return this.ingredients.get(id) || null;
    }
    async findAll() {
        return Array.from(this.ingredients.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
    async findByUser(userId) {
        const userIngredients = [];
        for (const ingredient of this.ingredients.values()) {
            if (ingredient.createdBy === userId) {
                userIngredients.push(ingredient);
            }
        }
        return userIngredients;
    }
    async delete(id) {
        return this.ingredients.delete(id);
    }
}
exports.IngredientRepositories = IngredientRepositories;
