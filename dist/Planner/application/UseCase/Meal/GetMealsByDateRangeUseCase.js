"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMealsByDateRangeUseCase = void 0;
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class GetMealsByDateRangeUseCase {
    constructor(mealRepository, ingredientRepository) {
        this.mealRepository = mealRepository;
        this.ingredientRepository = ingredientRepository;
    }
    async execute(request) {
        const { startDate, endDate } = request;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            throw new AppErrors_1.AppError("La fecha de inicio debe ser anterior a la fecha de fin", 400);
        }
        const filteredMeals = await this.mealRepository.findByDateRange(start, end);
        const groupedByDate = {};
        for (const meal of filteredMeals) {
            const dateKey = meal.date.toISOString().split("T")[0];
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }
            groupedByDate[dateKey].push({
                id: meal.id,
                name: meal.name,
                date: meal.date,
                mealTime: meal.mealTime,
                totalCalories: meal.totalCalories,
                createdAt: meal.createdAt,
            });
        }
        const result = [];
        for (const [dateKey, meals] of Object.entries(groupedByDate)) {
            const dailyTotal = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
            result.push({
                date: dateKey,
                totalCalories: dailyTotal,
                meals: meals.sort((a, b) => {
                    const times = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
                    return (times[a.mealTime] -
                        times[b.mealTime]);
                }),
            });
        }
        return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
}
exports.GetMealsByDateRangeUseCase = GetMealsByDateRangeUseCase;
