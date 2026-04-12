import { IMeal } from "../interfaces/IMeal";
import { IMealIngredient } from "../interfaces/IMealIngredient";
import { IMealStep } from "../interfaces/IMealStep";

export class Meal implements IMeal {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly date: Date,
    public readonly mealTime: string,
    public readonly ingredients: IMealIngredient[],
    public readonly steps: IMealStep[],
    public readonly categories: string[],
    public readonly CreatedBy: string,
    public readonly createdAt: Date,
    public readonly totalCalories: number,
    public readonly image?: string | null,
  ) {}

  static create(data: IMeal): Meal {
    return new Meal(
      data.id,
      data.name,
      data.date,
      data.mealTime,
      data.ingredients,
      data.steps ?? [],
      data.categories ?? [],
      data.CreatedBy,
      data.createdAt,
      data.totalCalories,
      data.image
    );
  }
}
