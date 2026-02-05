import { AppError } from '@shared/Errors/AppErrors';
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
    const { id, userId } = request;

    // Validaciones de entrada
    if (!id || id.trim().length === 0) {
      throw new AppError('El ID del ingrediente es requerido', 400);
    }

    if (!userId || userId.trim().length === 0) {
      throw new AppError('El ID del usuario es requerido', 400);
    }

    // Buscar el ingrediente
    const ingredient = await this.ingredientRepository.findById(id);
    
    if (!ingredient) {
      throw new AppError('Ingrediente no encontrado', 404);
    }

    // Verificar que el ingrediente pertenece al usuario
    if (ingredient.createdBy !== userId) {
      throw new AppError('No tienes permiso para ver este ingrediente', 403);
    }

    // Retornar el ingrediente
    return {
      id: ingredient.id,
      name: ingredient.name,
      caloriesPer100g: ingredient.caloriesPer100g,
      createdBy: ingredient.createdBy,
      createdAt: ingredient.createdAt
    };
  }
}