"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateIngredientUseCase = void 0;
const Ingredients_1 = require("src/Planner/Domain/Entities/Ingredients");
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class UpdateIngredientUseCase {
    constructor(ingredientRepository) {
        this.ingredientRepository = ingredientRepository;
    }
    async execute(request) {
        const { id, name, caloriesPer100g } = request;
        const existingIngredient = await this.ingredientRepository.findById(id);
        if (!existingIngredient) {
            throw new AppErrors_1.AppError('Ingrediente no encontrado', 404);
        }
        const updatedName = name?.trim() || existingIngredient.name;
        const updatedCalories = caloriesPer100g !== undefined ? caloriesPer100g : existingIngredient.caloriesPer100g;
        if (updatedName.length < 2) {
            throw new AppErrors_1.AppError('El nombre del ingrediente debe tener al menos 2 caracteres', 400);
        }
        if (updatedCalories < 0) {
            throw new AppErrors_1.AppError('Las calorías no pueden ser negativas', 400);
        }
        if (updatedName.toLowerCase() !== existingIngredient.name.toLowerCase()) {
            const allIngredients = await this.ingredientRepository.findAll();
            const duplicate = allIngredients.find((ingredient) => ingredient.id !== id &&
                ingredient.name.toLowerCase() === updatedName.toLowerCase());
            if (duplicate) {
                throw new AppErrors_1.AppError('Ya existe un ingrediente con ese nombre', 409);
            }
        }
        const updatedIngredient = Ingredients_1.Ingredients.create({
            id: existingIngredient.id,
            name: updatedName,
            caloriesPer100g: updatedCalories,
            createdBy: existingIngredient.createdBy,
            createdAt: existingIngredient.createdAt,
        });
        // Actualizar en el repositorio
        await this.ingredientRepository.create(updatedIngredient);
        return {
            id: updatedIngredient.id,
            name: updatedIngredient.name,
            caloriesPer100g: updatedIngredient.caloriesPer100g,
            createdAt: updatedIngredient.createdAt
        };
    }
}
exports.UpdateIngredientUseCase = UpdateIngredientUseCase;
