import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { AppError } from "@shared/Errors/AppErrors";

interface DeleteIngredientRequest {
  id: string;
  userId: string;
}

export class DeleteIngredientUseCase {
  constructor(private ingredientRepository: IngredientRepository) {}

  async execute(request: DeleteIngredientRequest): Promise<boolean> {
    const { id, userId } = request;
    
    const deleted = await this.ingredientRepository.delete(id, userId);
    
    if (!deleted) {
      throw new AppError('Ingrediente no encontrado o no tienes permiso para eliminarlo', 404);
    }
    
    return true;
  }
}
