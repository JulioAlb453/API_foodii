import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";

interface SearchIngredientsRequest {
  userId: string;
  query: string;
  limit?: number;
}

interface SearchIngredientResponse {
  id: string;
  name: string;
  caloriesPer100g: number;
}

export class SearchIngredientsUseCase {
  constructor(private ingredientRepository: IngredientRepository) {}

  async execute(
    request: SearchIngredientsRequest,
  ): Promise<SearchIngredientResponse[]> {
    const { query, limit = 10 } = request;

    if (!query || query.trim().length < 2) {
      return [];
    }

    const allIngredients = await this.ingredientRepository.findAll();
    const searchTerm = query.toLowerCase().trim();
    const filtered = allIngredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(searchTerm),
    );

    filtered.sort((a, b) => {
      const aStartsWith = a.name.toLowerCase().startsWith(searchTerm);
      const bStartsWith = b.name.toLowerCase().startsWith(searchTerm);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      return a.name.localeCompare(b.name);
    });

    const limitedResults = filtered.slice(0, limit);

    return limitedResults.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      caloriesPer100g: ingredient.caloriesPer100g,
    }));
  }
}
