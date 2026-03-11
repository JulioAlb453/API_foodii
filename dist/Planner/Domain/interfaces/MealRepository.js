"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MealRepositories = void 0;
class MealRepositories {
    constructor() {
        this.meals = new Map();
    }
    async create(meal) {
        this.meals.set(meal.id, meal);
        return meal;
    }
    async findById(id) {
        return this.meals.get(id) || null;
    }
    async findAll() {
        return Array.from(this.meals.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    async findByDate(date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const result = [];
        for (const meal of this.meals.values()) {
            const mealDate = new Date(meal.date);
            mealDate.setHours(0, 0, 0, 0);
            if (mealDate.getTime() === targetDate.getTime())
                result.push(meal);
        }
        return result.sort((a, b) => (a.mealTime.localeCompare(b.mealTime)));
    }
    async findByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const result = [];
        for (const meal of this.meals.values()) {
            const d = new Date(meal.date).getTime();
            if (d >= start.getTime() && d <= end.getTime())
                result.push(meal);
        }
        return result.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    async findByUserAndDate(userId, date) {
        const userMeals = [];
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        for (const meal of this.meals.values()) {
            const mealDate = new Date(meal.date);
            mealDate.setHours(0, 0, 0, 0);
            if (meal.CreatedBy === userId && mealDate.getTime() === targetDate.getTime()) {
                userMeals.push(meal);
            }
        }
        return userMeals;
    }
    async findByUser(userId) {
        const userMeals = [];
        for (const meal of this.meals.values()) {
            if (meal.CreatedBy === userId) {
                userMeals.push(meal);
            }
        }
        return userMeals.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    async delete(id, userId) {
        const meal = await this.findById(id);
        if (meal && meal.CreatedBy === userId) {
            return this.meals.delete(id);
        }
        return false;
    }
}
exports.MealRepositories = MealRepositories;
