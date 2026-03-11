"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateIngredientUseCase = void 0;
const Ingredients_1 = require("src/Planner/Domain/Entities/Ingredients");
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class CreateIngredientUseCase {
    constructor(ingredientRepository) {
        this.ingredientRepository = ingredientRepository;
    }
    async execute(request) {
        const { name, caloriesPer100g, userId } = request;
        if (!name || name.trim().length < 2) {
            throw new AppErrors_1.AppError('El nombre del ingrediente debe tener al menos 2 caracteres', 400);
        }
        if (caloriesPer100g < 0) {
            throw new AppErrors_1.AppError('Las calorías no pueden ser negativas', 400);
        }
        const allIngredients = await this.ingredientRepository.findAll();
        const existingIngredient = allIngredients.find((ingredient) => ingredient.name.toLowerCase() === name.toLowerCase().trim());
        if (existingIngredient) {
            throw new AppErrors_1.AppError('Ya existe un ingrediente con ese nombre', 409);
        }
        const ingredient = Ingredients_1.Ingredients.create({
            id: crypto.randomUUID(),
            name: name.trim(),
            caloriesPer100g,
            createdBy: userId,
            createdAt: new Date()
        });
        await this.ingredientRepository.create(ingredient);
        return {
            id: ingredient.id,
            name: ingredient.name,
            caloriesPer100g: ingredient.caloriesPer100g,
            createdAt: ingredient.createdAt
        };
    }
}
exports.CreateIngredientUseCase = CreateIngredientUseCase;
