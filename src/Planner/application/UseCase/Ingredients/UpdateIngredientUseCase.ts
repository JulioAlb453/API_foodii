import { Ingredients } from "src/Planner/Domain/Entities/Ingredients";
import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { AppError } from "src/shared/Errors/AppErrors";

interface UpdateIngredientRequest {
  id: string;
  name?: string;
  caloriesPer100g?: number;
  userId: string;
}

interface UpdateIngredientResponse {
  id: string;
  name: string;
  caloriesPer100g: number;
  createdAt: Date;
}

export class UpdateIngredientUseCase {
  constructor(private ingredientRepository: IngredientRepository) {}

  async execute(request: UpdateIngredientRequest): Promise<UpdateIngredientResponse> {
    const { id, name, caloriesPer100g } = request;

    const existingIngredient = await this.ingredientRepository.findById(id);

    if (!existingIngredient) {
      throw new AppError('Ingrediente no encontrado', 404);
    }

    const updatedName = name?.trim() || existingIngredient.name;
    const updatedCalories = caloriesPer100g !== undefined ? caloriesPer100g : existingIngredient.caloriesPer100g;

    if (updatedName.length < 2) {
      throw new AppError('El nombre del ingrediente debe tener al menos 2 caracteres', 400);
    }

    if (updatedCalories < 0) {
      throw new AppError('Las calorías no pueden ser negativas', 400);
    }

    if (updatedName.toLowerCase() !== existingIngredient.name.toLowerCase()) {
      const allIngredients = await this.ingredientRepository.findAll();
      const duplicate = allIngredients.find(
        (ingredient) =>
          ingredient.id !== id &&
          ingredient.name.toLowerCase() === updatedName.toLowerCase()
      );
      if (duplicate) {
        throw new AppError('Ya existe un ingrediente con ese nombre', 409);
      }
    }

    const updatedIngredient = Ingredients.create({
      id: existingIngredient.id,
      name: updatedName,
      caloriesPer100g: updatedCalories,
      createdBy: existingIngredient.createdBy,
      createdAt: existingIngredient.createdAt,
    });

    // Actualizar en el repositorio
    await this.ingredientRepository.create(updatedIngredient);

    return {
      id: updatedIngredient.id,
      name: updatedIngredient.name,
      caloriesPer100g: updatedIngredient.caloriesPer100g,
      createdAt: updatedIngredient.createdAt
    };
  }
}
