import { IIngredients } from "../interfaces/IIngredients";

export class Ingredients {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly caloriesPer100g: number,
    public readonly createdBy: string,
    public readonly createdAt: Date,
  ) {}

  static create(data: IIngredients) {
    return new Ingredients(
      data.id,
      data.name,
      data.caloriesPer100g,
      data.createdBy,
      data.createdAt,
    );
  }

  calculateCalories(amount: number) {
    return (amount * this.caloriesPer100g) / 100;
  }
}
