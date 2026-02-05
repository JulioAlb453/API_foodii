import { Ingredients } from "src/Planner/Domain/Entities/Ingredients";
import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { AppError } from "@shared/Errors/AppErrors";

interface CreateIngredientRequest {
  name: string;
  caloriesPer100g: number;
  userId: string;
}

interface CreateIngredientResponse {
  id: string;
  name: string;
  caloriesPer100g: number;
  createdAt: Date;
}

export class CreateIngredientUseCase {
  constructor(private ingredientRepository: IngredientRepository) {}

  async execute(request: CreateIngredientRequest): Promise<CreateIngredientResponse> {
    const { name, caloriesPer100g, userId } = request;

    if (!name || name.trim().length < 2) {
      throw new AppError('El nombre del ingrediente debe tener al menos 2 caracteres', 400);
    }

    if (caloriesPer100g < 0) {
      throw new AppError('Las calorías no pueden ser negativas', 400);
    }

    const userIngredients = await this.ingredientRepository.findByUser(userId);
    const existingIngredient = userIngredients.find(
      ingredient => ingredient.name.toLowerCase() === name.toLowerCase().trim()
    );

    if (existingIngredient) {
      throw new AppError('Ya tienes un ingrediente con ese nombre', 409);
    }

    const ingredient = Ingredients.create({
      id: crypto.randomUUID(),
      name: name.trim(),
      caloriesPer100g,
      createdBy: userId,
      createdAt: new Date()
    });

    await this.ingredientRepository.create(ingredient);

    return {
      id: ingredient.id,
      name: ingredient.name,
      caloriesPer100g: ingredient.caloriesPer100g,
      createdAt: ingredient.createdAt
    };
  }
}
