"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMealsUseCase = void 0;
class GetMealsUseCase {
    constructor(mealRepository, ingredientRepository) {
        this.mealRepository = mealRepository;
        this.ingredientRepository = ingredientRepository;
    }
    async execute(request) {
        const { date } = request;
        // Obtener todas las comidas (catálogo compartido) o filtradas por fecha
        const meals = date
            ? await this.mealRepository.findByDate(new Date(date))
            : await this.mealRepository.findAll();
        // Enriquecer comidas con detalles de ingredientes
        const enrichedMeals = [];
        for (const meal of meals) {
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
            enrichedMeals.push({
                id: meal.id,
                name: meal.name,
                date: meal.date,
                mealTime: meal.mealTime,
                ingredients: ingredientsDetails,
                totalCalories: meal.totalCalories,
                createdAt: meal.createdAt,
            });
        }
        return enrichedMeals;
    }
}
exports.GetMealsUseCase = GetMealsUseCase;
