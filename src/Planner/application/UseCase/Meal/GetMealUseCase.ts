import { MealRepository } from "src/Planner/Domain/interfaces/MealRepository";
import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";

interface GetMealsRequest {
  date?: string;
}

interface MealIngredientResponse {
  ingredientId: string;
  amount: number;
  ingredientName: string;
  calories: number;
}

interface MealStepResponse {
  stepOrder: number;
  description: string;
}

interface MealResponse {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  ingredients: MealIngredientResponse[];
  steps: MealStepResponse[];
  categories: string[];
  totalCalories: number;
  createdAt: Date;
  image?: string | null;
}

export class GetMealsUseCase {
  constructor(
    private mealRepository: MealRepository,
    private ingredientRepository: IngredientRepository,
  ) {}

  async execute(request: GetMealsRequest): Promise<MealResponse[]> {
    const { date } = request;

    // Obtener todas las comidas (catálogo compartido) o filtradas por fecha
    const meals = date
      ? await this.mealRepository.findByDate(new Date(date))
      : await this.mealRepository.findAll();

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
        steps: meal.steps.map((s) => ({
          stepOrder: s.stepOrder,
          description: s.description,
        })),
        categories: meal.categories ?? [],
        totalCalories: meal.totalCalories,
        createdAt: meal.createdAt,
        image: meal.image,
      });
    }

    return enrichedMeals;
  }
}
