import { MealRepository } from "src/Planner/Domain/interfaces/MealRepository";
import { IngredientsRepository } from "src/Planner/Domain/interfaces/IngredientsRepository";
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
    private ingredientRepository: IngredientsRepository,
  ) {}

  async execute(request: GetMealByIdRequest): Promise<GetMealByIdResponse> {
    const { id, userId } = request;

    const meal = await this.mealRepository.findById(id);

    if (!meal) {
      throw new AppError("Comida no encontrada", 404);
    }

    if (meal.CreatedBy !== userId) {
      throw new AppError("No tienes permiso para ver esta comida", 403);
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
