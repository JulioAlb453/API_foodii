"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ingredients = void 0;
class Ingredients {
    constructor(id, name, caloriesPer100g, createdBy, createdAt) {
        this.id = id;
        this.name = name;
        this.caloriesPer100g = caloriesPer100g;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }
    static create(data) {
        return new Ingredients(data.id, data.name, data.caloriesPer100g, data.createdBy, data.createdAt);
    }
    calculateCalories(amount) {
        return (amount * this.caloriesPer100g) / 100;
    }
}
exports.Ingredients = Ingredients;
