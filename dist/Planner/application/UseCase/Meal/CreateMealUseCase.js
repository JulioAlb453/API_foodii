"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMealUseCase = void 0;
const Meal_1 = require("src/Planner/Domain/Entities/Meal");
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class CreateMealUseCase {
    constructor(mealRepository, ingredientRepository) {
        this.mealRepository = mealRepository;
        this.ingredientRepository = ingredientRepository;
    }
    async execute(request) {
        const { name, date, mealTime, ingredients, userId } = request;
        if (!name || name.trim().length < 2) {
            throw new AppErrors_1.AppError("El nombre de la comida debe tener al menos 2 caracteres", 400);
        }
        if (!["breakfast", "lunch", "dinner", "snack"].includes(mealTime)) {
            throw new AppErrors_1.AppError("Hora de comida inválida. Debe ser: breakfast, lunch, dinner o snack", 400);
        }
        if (!ingredients || ingredients.length === 0) {
            throw new AppErrors_1.AppError("La comida debe tener al menos un ingrediente", 400);
        }
        const ingredientDetails = [];
        let totalCalories = 0;
        for (const item of ingredients) {
            if (item.amount <= 0) {
                throw new AppErrors_1.AppError("La cantidad del ingrediente debe ser mayor que 0", 400);
            }
            const ingredient = await this.ingredientRepository.findById(item.ingredientId);
            if (!ingredient) {
                throw new AppErrors_1.AppError(`Ingrediente con ID ${item.ingredientId} no encontrado`, 404);
            }
            const calories = (ingredient.caloriesPer100g * item.amount) / 100;
            ingredientDetails.push({
                ingredientId: item.ingredientId,
                amount: item.amount,
                ingredientName: ingredient.name,
                calories,
            });
            totalCalories += calories;
        }
        // Crear la comida
        const meal = Meal_1.Meal.create({
            id: crypto.randomUUID(),
            name: name.trim(),
            date: new Date(date),
            mealTime,
            ingredients: ingredients.map((item) => ({
                ingredientId: item.ingredientId,
                amount: item.amount,
            })),
            CreatedBy: userId,
            createdAt: new Date(),
            totalCalories,
        });
        // Guardar la comida
        await this.mealRepository.create(meal);
        return {
            id: meal.id,
            name: meal.name,
            date: meal.date,
            mealTime: meal.mealTime,
            ingredients: ingredientDetails,
            totalCalories,
            createdAt: meal.createdAt,
        };
    }
}
exports.CreateMealUseCase = CreateMealUseCase;
