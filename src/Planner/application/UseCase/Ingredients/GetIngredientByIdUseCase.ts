import { AppError } from "src/shared/Errors/AppErrors";
import { IngredientRepository } from 'src/Planner/Domain/interfaces/IngredientRepository';

interface GetIngredientByIdRequest {
  id: string;
  userId: string;
}

interface GetIngredientByIdResponse {
  id: string;
  name: string;
  caloriesPer100g: number;
  createdBy: string;
  createdAt: Date;
}

export class GetIngredientByIdUseCase {
  constructor(private ingredientRepository: IngredientRepository) {}

  async execute(request: GetIngredientByIdRequest): Promise<GetIngredientByIdResponse> {
    const { id } = request;

    if (!id || id.trim().length === 0) {
      throw new AppError('El ID del ingrediente es requerido', 400);
    }

    const ingredient = await this.ingredientRepository.findById(id);

    if (!ingredient) {
      throw new AppError('Ingrediente no encontrado', 404);
    }

    return {
      id: ingredient.id,
      name: ingredient.name,
      caloriesPer100g: ingredient.caloriesPer100g,
      createdBy: ingredient.createdBy,
      createdAt: ingredient.createdAt
    };
  }
}