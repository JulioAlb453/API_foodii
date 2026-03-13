"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Meal = void 0;
class Meal {
    constructor(id, name, date, mealTime, ingredients, CreatedBy, createdAt, totalCalories, image) {
        this.id = id;
        this.name = name;
        this.date = date;
        this.mealTime = mealTime;
        this.ingredients = ingredients;
        this.CreatedBy = CreatedBy;
        this.createdAt = createdAt;
        this.totalCalories = totalCalories;
        this.image = image;
    }
    static create(data) {
        return new Meal(data.id, data.name, data.date, data.mealTime, data.ingredients, data.CreatedBy, data.createdAt, data.totalCalories, data.image);
    }
}
exports.Meal = Meal;
