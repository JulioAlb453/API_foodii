"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMealByIdUseCase = void 0;
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class GetMealByIdUseCase {
    constructor(mealRepository, ingredientRepository) {
        this.mealRepository = mealRepository;
        this.ingredientRepository = ingredientRepository;
    }
    async execute(request) {
        const { id } = request;
        const meal = await this.mealRepository.findById(id);
        if (!meal) {
            throw new AppErrors_1.AppError("Comida no encontrada", 404);
        }
        const ingredientsDetails = [];
        for (const item of meal.ingredients) {
            const ingredient = await this.ingredientRepository.findById(item.ingredientId);
            if (ingredient) {
                const calories = (ingredient.caloriesPer100g * item.amount) / 100;
                ingredientsDetails.push({
                    ingredientId: item.ingredientId,
                    amount: item.amount,
                    ingredientName: ingredient.name,
                    calories,
                });
            }
        }
        return {
            id: meal.id,
            name: meal.name,
            date: meal.date,
            mealTime: meal.mealTime,
            ingredients: ingredientsDetails,
            totalCalories: meal.totalCalories,
            createdAt: meal.createdAt,
        };
    }
}
exports.GetMealByIdUseCase = GetMealByIdUseCase;
