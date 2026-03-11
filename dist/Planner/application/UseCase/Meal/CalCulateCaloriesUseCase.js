"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculateCaloriesUseCase = void 0;
class CalculateCaloriesUseCase {
    constructor(mealRepository) {
        this.mealRepository = mealRepository;
    }
    async execute(request) {
        const { date } = request;
        const meals = date
            ? await this.mealRepository.findByDate(new Date(date))
            : await this.mealRepository.findAll();
        if (meals.length === 0) {
            return {
                totalCalories: 0,
                mealsCount: 0,
                averageCaloriesPerMeal: 0,
                mealsByTime: {
                    breakfast: 0,
                    lunch: 0,
                    dinner: 0,
                    snack: 0,
                },
            };
        }
        let totalCalories = 0;
        const mealsByTime = {
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            snack: 0,
        };
        for (const meal of meals) {
            totalCalories += meal.totalCalories;
            if (meal.mealTime === "breakfast")
                mealsByTime.breakfast++;
            else if (meal.mealTime === "lunch")
                mealsByTime.lunch++;
            else if (meal.mealTime === "dinner")
                mealsByTime.dinner++;
            else if (meal.mealTime === "snack")
                mealsByTime.snack++;
        }
        return {
            totalCalories,
            mealsCount: meals.length,
            averageCaloriesPerMeal: Math.round(totalCalories / meals.length),
            mealsByTime,
        };
    }
}
exports.CalculateCaloriesUseCase = CalculateCaloriesUseCase;
