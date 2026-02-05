import { Ingredients } from "../Entities/Ingredients";

export interface IngredientsReposotory {
  create(ingredients: Ingredients): Promise<Ingredients>;
  findById(id: string): Promise<Ingredients | null>;
  findByUser(userId: string): Promise<Ingredients[]>;
  delete(id: string, userId: string): Promise<boolean>;
}

export class IngredientsRepositories implements IngredientsReposotory {
  private ingredients: Map<string, Ingredients> = new Map();

  async create(ingredients: Ingredients): Promise<Ingredients> {
    this.ingredients.set(ingredients.id, ingredients);
    return ingredients;
  }

  async findById(id: string): Promise<Ingredients | null> {
    return this.ingredients.get(id) || null;
  }

  async findByUser(userId: string): Promise<Ingredients[]> {
    const userIngredients: Ingredients[] = [];

    for (const ingredient of this.ingredients.values()) {
      if (ingredient.createdBy === userId) {
        userIngredients.push(ingredient);
      }
    }

    return userIngredients;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const ingredient = await this.findById(id);

    if (ingredient && ingredient.createdBy === userId) {
      return this.ingredients.delete(id);
    }

    return false;
  }
}
