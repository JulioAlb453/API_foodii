import { MealRepository } from "src/Planner/Domain/interfaces/MealRepository";
import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";

interface GetMealsRequest {
  userId: string;
  date?: string;
}

interface MealIngredientResponse {
  ingredientId: string;
  amount: number;
  ingredientName: string;
  calories: number;
}

interface MealResponse {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  ingredients: MealIngredientResponse[];
  totalCalories: number;
  createdAt: Date;
}

export class GetMealsUseCase {
  constructor(
    private mealRepository: MealRepository,
    private ingredientRepository: IngredientRepository,
  ) {}

  async execute(request: GetMealsRequest): Promise<MealResponse[]> {
    const { userId, date } = request;

    // Obtener comidas
    const meals = date
      ? await this.mealRepository.findByUserAndDate(userId, new Date(date))
      : await this.mealRepository.findByUser(userId);

    // Enriquecer comidas con detalles de ingredientes
    const enrichedMeals: MealResponse[] = [];

    for (const meal of meals) {
      const ingredientsDetails: MealIngredientResponse[] = [];

      for (const item of meal.ingredients) {
        const ingredient = await this.ingredientRepository.findById(
          item.ingredientId,
        );

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
