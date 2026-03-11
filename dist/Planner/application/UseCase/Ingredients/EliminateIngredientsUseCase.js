"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteIngredientUseCase = void 0;
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class DeleteIngredientUseCase {
    constructor(ingredientRepository) {
        this.ingredientRepository = ingredientRepository;
    }
    async execute(request) {
        const { id } = request;
        const deleted = await this.ingredientRepository.delete(id);
        if (!deleted) {
            throw new AppErrors_1.AppError('Ingrediente no encontrado', 404);
        }
        return true;
    }
}
exports.DeleteIngredientUseCase = DeleteIngredientUseCase;
