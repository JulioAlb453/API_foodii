import { Ingredients } from "../Entities/Ingredients";

export interface IngredientRepository {
  create(ingredients: Ingredients): Promise<Ingredients>;
  findById(id: string): Promise<Ingredients | null>;
  /** Todas los ingredientes (catálogo compartido) */
  findAll(): Promise<Ingredients[]>;
  findByUser(userId: string): Promise<Ingredients[]>;
  delete(id: string): Promise<boolean>;
}

export class IngredientRepositories implements IngredientRepository {
  private ingredients: Map<string, Ingredients> = new Map();

  async create(ingredients: Ingredients): Promise<Ingredients> {
    this.ingredients.set(ingredients.id, ingredients);
    return ingredients;
  }

  async findById(id: string): Promise<Ingredients | null> {
    return this.ingredients.get(id) || null;
  }

  async findAll(): Promise<Ingredients[]> {
    return Array.from(this.ingredients.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
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

  async delete(id: string): Promise<boolean> {
    return this.ingredients.delete(id);
  }
}
