"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMealUseCase = void 0;
const Meal_1 = require("../../../Domain/Entities/Meal");
const AppErrors_1 = require("src/shared/Errors/AppErrors");
const notificationCategorySlug_1 = require("src/shared/Notifications/notificationCategorySlug");
const normalizeMealSteps_1 = require("./normalizeMealSteps");
class UpdateMealUseCase {
    constructor(mealRepository, ingredientRepository) {
        this.mealRepository = mealRepository;
        this.ingredientRepository = ingredientRepository;
    }
    async execute(request) {
        const { id, userId, name, date, mealTime, ingredients, image } = request;
        const existingMeal = await this.mealRepository.findById(id);
        if (!existingMeal) {
            throw new AppErrors_1.AppError("Comida no encontrada", 404);
        }
        if (existingMeal.CreatedBy !== userId) {
            throw new AppErrors_1.AppError("No tienes permiso para actualizar esta comida", 403);
        }
        const updatedName = name?.trim() || existingMeal.name;
        const updatedDate = date ? new Date(date) : existingMeal.date;
        const updatedMealTime = mealTime || existingMeal.mealTime;
        const updatedIngredients = ingredients || existingMeal.ingredients;
        const updatedImage = image !== undefined ? image : existingMeal.image;
        const updatedSteps = request.steps !== undefined
            ? (0, normalizeMealSteps_1.normalizeMealSteps)(request.steps)
            : existingMeal.steps;
        const updatedCategories = request.categories !== undefined
            ? request.categories == null || request.categories.length === 0
                ? []
                : (0, notificationCategorySlug_1.mapPreferenceStringsToSlugs)(request.categories)
            : existingMeal.categories;
        if (updatedName.length < 2) {
            throw new AppErrors_1.AppError("El nombre debe tener al menos 2 caracteres", 400);
        }
        if (!["breakfast", "lunch", "dinner", "snack"].includes(updatedMealTime)) {
            throw new AppErrors_1.AppError("Hora de comida inválida", 400);
        }
        if (updatedIngredients.length === 0) {
            throw new AppErrors_1.AppError("La comida debe tener al menos un ingrediente", 400);
        }
        const ingredientDetails = [];
        let totalCalories = 0;
        for (const item of updatedIngredients) {
            if (item.amount <= 0) {
                throw new AppErrors_1.AppError("La cantidad debe ser mayor que 0", 400);
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
        const updatedMeal = Meal_1.Meal.create({
            id: existingMeal.id,
            name: updatedName,
            date: updatedDate,
            mealTime: updatedMealTime,
            ingredients: updatedIngredients,
            steps: updatedSteps,
            categories: updatedCategories,
            CreatedBy: userId,
            createdAt: existingMeal.createdAt,
            totalCalories,
            image: updatedImage,
        });
        await this.mealRepository.create(updatedMeal);
        return {
            id: updatedMeal.id,
            name: updatedMeal.name,
            date: updatedMeal.date,
            mealTime: updatedMeal.mealTime,
            ingredients: ingredientDetails,
            steps: updatedMeal.steps.map((s) => ({
                stepOrder: s.stepOrder,
                description: s.description,
            })),
            categories: updatedMeal.categories,
            totalCalories,
            createdAt: updatedMeal.createdAt,
            image: updatedMeal.image,
        };
    }
}
exports.UpdateMealUseCase = UpdateMealUseCase;
