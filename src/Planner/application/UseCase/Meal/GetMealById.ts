import { MealRepository } from "src/Planner/Domain/interfaces/MealRepository";
import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { AppError } from "src/shared/Errors/AppErrors";

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

interface MealStepResponse {
  stepOrder: number;
  description: string;
}

interface GetMealByIdResponse {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  ingredients: MealIngredientResponse[];
  steps: MealStepResponse[];
  totalCalories: number;
  createdAt: Date;
  image?: string | null;
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
      steps: meal.steps.map((s) => ({
        stepOrder: s.stepOrder,
        description: s.description,
      })),
      totalCalories: meal.totalCalories,
      createdAt: meal.createdAt,
      image: meal.image,
    };
  }
}
