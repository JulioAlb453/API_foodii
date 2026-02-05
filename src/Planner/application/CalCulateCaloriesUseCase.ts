import { MealRepository } from "../Domain/interfaces/MealRepository";

interface CalculateCaloriesRequest {
  userId: string;
  date?: string;
}

interface CaloriesSummary {
  totalCalories: number;
  mealsCount: number;
  averageCaloriesPerMeal: number;
  mealsByTime: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
  };
}

export class CalculateCaloriesUseCase {
  constructor(private mealRepository: MealRepository) {}

  async execute(request: CalculateCaloriesRequest): Promise<CaloriesSummary> {
    const { userId, date } = request;

    const meals = date
      ? await this.mealRepository.findByUserAndDate(userId, new Date(date))
      : await this.mealRepository.findByUser(userId);

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

      if (meal.mealTime === "breakfast") mealsByTime.breakfast++;
      else if (meal.mealTime === "lunch") mealsByTime.lunch++;
      else if (meal.mealTime === "dinner") mealsByTime.dinner++;
      else if (meal.mealTime === "snack") mealsByTime.snack++;
    }

    return {
      totalCalories,
      mealsCount: meals.length,
      averageCaloriesPerMeal: Math.round(totalCalories / meals.length),
      mealsByTime,
    };
  }
}
