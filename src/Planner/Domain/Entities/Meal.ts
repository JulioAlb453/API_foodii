import { IMeal } from "../interfaces/IMeal";
import { IMealIngredient } from "../interfaces/IMealIngredient";

export class Meal implements IMeal {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly date: Date,
    public readonly mealTime: string,
    public readonly ingredients: IMealIngredient[],
    public readonly CreatedBy: string,
    public readonly createdAt: Date,
    public readonly totalCalories: number,
  ) {}

  static create(
    id: string,
    name: string,
    date: Date,
    mealTime: string,
    ingredients: IMealIngredient[],
    CreatedBy: string,
    createdAt: Date,
    totalCalories: number,
  ): Meal {
    return new Meal(
      id,
      name,
      date,
      mealTime,
      ingredients,
      CreatedBy,
      createdAt,
      totalCalories,
    );
  }
}
