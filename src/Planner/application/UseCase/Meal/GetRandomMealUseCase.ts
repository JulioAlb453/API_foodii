import { MealRepository } from "src/Planner/Domain/interfaces/MealRepository";
import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { AppError } from "src/shared/Errors/AppErrors";

interface MealIngredientResponse {
  ingredientId: string;
  amount: number;
  ingredientName: string;
  calories: number;
}

interface GetRandomMealResponse {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  ingredients: MealIngredientResponse[];
  totalCalories: number;
  createdAt: Date;
  image?: string | null;
}

export class GetRandomMealUseCase {
  constructor(
    private mealRepository: MealRepository,
    private ingredientRepository: IngredientRepository,
  ) {}

  async execute(userId: string): Promise<GetRandomMealResponse> {
    const meal = await this.mealRepository.getRandomMeal(userId);

    if (!meal) {
      throw new AppError("No se encontraron comidas para este usuario", 404);
    }

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

    return {
      id: meal.id,
      name: meal.name,
      date: meal.date,
      mealTime: meal.mealTime,
      ingredients: ingredientsDetails,
      totalCalories: meal.totalCalories,
      createdAt: meal.createdAt,
      image: meal.image,
    };
  }
}
