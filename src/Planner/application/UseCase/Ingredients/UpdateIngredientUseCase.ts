import { Ingredients } from "src/Planner/Domain/Entities/Ingredients";
import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { AppError } from "@shared/Errors/AppErrors";

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
    const { id, userId, name, caloriesPer100g } = request;

    // Buscar ingrediente existente
    const existingIngredient = await this.ingredientRepository.findById(id);
    
    if (!existingIngredient) {
      throw new AppError('Ingrediente no encontrado', 404);
    }

    // Verificar que el ingrediente pertenece al usuario
    if (existingIngredient.createdBy !== userId) {
      throw new AppError('No tienes permiso para actualizar este ingrediente', 403);
    }

    // Preparar datos actualizados
    const updatedName = name?.trim() || existingIngredient.name;
    const updatedCalories = caloriesPer100g !== undefined ? caloriesPer100g : existingIngredient.caloriesPer100g;

    // Validaciones
    if (updatedName.length < 2) {
      throw new AppError('El nombre del ingrediente debe tener al menos 2 caracteres', 400);
    }

    if (updatedCalories < 0) {
      throw new AppError('Las calorías no pueden ser negativas', 400);
    }

    // Verificar si ya existe otro ingrediente con el mismo nombre (excluyendo este)
    if (updatedName.toLowerCase() !== existingIngredient.name.toLowerCase()) {
      const userIngredients = await this.ingredientRepository.findByUser(userId);
      const duplicate = userIngredients.find(
        ingredient => 
          ingredient.id !== id && 
          ingredient.name.toLowerCase() === updatedName.toLowerCase()
      );

      if (duplicate) {
        throw new AppError('Ya tienes un ingrediente con ese nombre', 409);
      }
    }

    // Crear ingrediente actualizado
    const updatedIngredient = Ingredients.create({
      id: existingIngredient.id,
      name: updatedName,
      caloriesPer100g: updatedCalories,
      createdBy: userId,
      createdAt: existingIngredient.createdAt
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
