import { MealRepository } from "../../../Domain/interfaces/MealRepository";
import { IngredientRepository } from "../../../Domain/interfaces/IngredientRepository";
import { AppError } from "@shared/Errors/AppErrors";

interface GetMealsByDateRangeRequest {
  userId: string;
  startDate: string;
  endDate: string;
}

interface MealResponse {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  totalCalories: number;
  createdAt: Date;
}

interface DailySummary {
  date: string;
  totalCalories: number;
  meals: MealResponse[];
}

export class GetMealsByDateRangeUseCase {
  constructor(
    private mealRepository: MealRepository,
    private ingredientRepository: IngredientRepository,
  ) {}

  async execute(request: GetMealsByDateRangeRequest): Promise<DailySummary[]> {
    const { startDate, endDate } = request;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new AppError(
        "La fecha de inicio debe ser anterior a la fecha de fin",
        400,
      );
    }

    const filteredMeals = await this.mealRepository.findByDateRange(start, end);

    const groupedByDate: Record<string, MealResponse[]> = {};

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

    const result: DailySummary[] = [];

    for (const [dateKey, meals] of Object.entries(groupedByDate)) {
      const dailyTotal = meals.reduce(
        (sum, meal) => sum + meal.totalCalories,
        0,
      );

      result.push({
        date: dateKey,
        totalCalories: dailyTotal,
        meals: meals.sort((a, b) => {
          const times = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
          return (
            times[a.mealTime as keyof typeof times] -
            times[b.mealTime as keyof typeof times]
          );
        }),
      });
    }

    return result.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }
}
