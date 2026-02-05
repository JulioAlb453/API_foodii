import { MealRepository } from "src/Planner/Domain/interfaces/MealRepository";
import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { AppError } from "@shared/Errors/AppErrors";

interface GetMealByIdRequest {
  id: string;
  userId: string;
}

interface MealIngredientResponse {
  ingredientId: string;
  amount: number;
  ingredientName: string;
  calories: number;
}

interface GetMealByIdResponse {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  ingredients: MealIngredientResponse[];
  totalCalories: number;
  createdAt: Date;
}

export class GetMealByIdUseCase {
  constructor(
    private mealRepository: MealRepository,
    private ingredientRepository: IngredientRepository,
  ) {}

  async execute(request: GetMealByIdRequest): Promise<GetMealByIdResponse> {
    const { id } = request;

    const meal = await this.mealRepository.findById(id);

    if (!meal) {
      throw new AppError("Comida no encontrada", 404);
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
    };
  }
}
