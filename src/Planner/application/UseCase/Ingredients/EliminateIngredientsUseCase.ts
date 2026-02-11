import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { AppError } from "src/shared/Errors/AppErrors";
interface DeleteIngredientRequest {
  id: string;
  userId: string;
}

export class DeleteIngredientUseCase {
  constructor(private ingredientRepository: IngredientRepository) {}

  async execute(request: DeleteIngredientRequest): Promise<boolean> {
    const { id } = request;

    const deleted = await this.ingredientRepository.delete(id);

    if (!deleted) {
      throw new AppError('Ingrediente no encontrado', 404);
    }

    return true;
  }
}
