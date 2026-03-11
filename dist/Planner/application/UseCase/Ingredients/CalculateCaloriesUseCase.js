"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculateCaloriesUseCase = void 0;
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class CalculateCaloriesUseCase {
    constructor(ingredientRepository) {
        this.ingredientRepository = ingredientRepository;
    }
    async execute(request) {
        const { ingredientId, amount } = request;
        if (amount <= 0) {
            throw new AppErrors_1.AppError("La cantidad debe ser mayor que 0", 400);
        }
        const ingredient = await this.ingredientRepository.findById(ingredientId);
        if (!ingredient) {
            throw new AppErrors_1.AppError("Ingrediente no encontrado", 404);
        }
        const calculatedCalories = (ingredient.caloriesPer100g * amount) / 100;
        return {
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            amount,
            caloriesPer100g: ingredient.caloriesPer100g,
            calculatedCalories,
        };
    }
}
exports.CalculateCaloriesUseCase = CalculateCaloriesUseCase;
