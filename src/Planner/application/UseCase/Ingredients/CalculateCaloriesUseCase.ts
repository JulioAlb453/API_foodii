import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { AppError } from "src/shared/Errors/AppErrors";

interface CalculateCaloriesRequest {
  ingredientId: string;
  amount: number;
  userId: string;
}

interface CalculateCaloriesResponse {
  ingredientId: string;
  ingredientName: string;
  amount: number;
  caloriesPer100g: number;
  calculatedCalories: number;
}

export class CalculateCaloriesUseCase {
  constructor(private ingredientRepository: IngredientRepository) {}

  async execute(
    request: CalculateCaloriesRequest,
  ): Promise<CalculateCaloriesResponse> {
    const { ingredientId, amount, userId } = request;

    if (amount <= 0) {
      throw new AppError("La cantidad debe ser mayor que 0", 400);
    }

    const ingredient = await this.ingredientRepository.findById(ingredientId);

    if (!ingredient) {
      throw new AppError("Ingrediente no encontrado", 404);
    }

    if (ingredient.createdBy !== userId) {
      throw new AppError("No tienes permiso para usar este ingrediente", 403);
    }

    const calculatedCalories = (ingredient.caloriesPer100g * amount) / 100;

    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      amount,
      caloriesPer100g: ingredient.caloriesPer100g,
      calculatedCalories,
    };
  }
}
