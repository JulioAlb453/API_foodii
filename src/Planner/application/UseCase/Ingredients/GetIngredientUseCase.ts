import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";

interface GetIngredientsRequest {
  userId: string;
  search?: string;
}

interface IngredientResponse {
  id: string;
  name: string;
  caloriesPer100g: number;
  createdAt: Date;
}

export class GetIngredientsUseCase {
  constructor(private ingredientRepository: IngredientRepository) {}

  async execute(request: GetIngredientsRequest): Promise<IngredientResponse[]> {
    const { userId, search } = request;

    let ingredients = await this.ingredientRepository.findByUser(userId);

    if (search) {
      const searchLower = search.toLowerCase();
      ingredients = ingredients.filter((ingredient) =>
        ingredient.name.toLowerCase().includes(searchLower),
      );
    }

    ingredients.sort((a, b) => a.name.localeCompare(b.name));

    return ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      caloriesPer100g: ingredient.caloriesPer100g,
      createdAt: ingredient.createdAt,
    }));
  }
}
