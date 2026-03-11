"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetIngredientsUseCase = void 0;
class GetIngredientsUseCase {
    constructor(ingredientRepository) {
        this.ingredientRepository = ingredientRepository;
    }
    async execute(request) {
        const { search } = request;
        let ingredients = await this.ingredientRepository.findAll();
        if (search) {
            const searchLower = search.toLowerCase();
            ingredients = ingredients.filter((ingredient) => ingredient.name.toLowerCase().includes(searchLower));
        }
        ingredients.sort((a, b) => a.name.localeCompare(b.name));
        return ingredients.map((ingredient) => ({
            id: ingredient.id,
            name: ingredient.name,
            caloriesPer100g: ingredient.caloriesPer100g,
            createdAt: ingredient.createdAt,
        }));
    }
}
exports.GetIngredientsUseCase = GetIngredientsUseCase;
