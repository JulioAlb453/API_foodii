"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetIngredientByIdUseCase = void 0;
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class GetIngredientByIdUseCase {
    constructor(ingredientRepository) {
        this.ingredientRepository = ingredientRepository;
    }
    async execute(request) {
        const { id } = request;
        if (!id || id.trim().length === 0) {
            throw new AppErrors_1.AppError('El ID del ingrediente es requerido', 400);
        }
        const ingredient = await this.ingredientRepository.findById(id);
        if (!ingredient) {
            throw new AppErrors_1.AppError('Ingrediente no encontrado', 404);
        }
        return {
            id: ingredient.id,
            name: ingredient.name,
            caloriesPer100g: ingredient.caloriesPer100g,
            createdBy: ingredient.createdBy,
            createdAt: ingredient.createdAt
        };
    }
}
exports.GetIngredientByIdUseCase = GetIngredientByIdUseCase;
