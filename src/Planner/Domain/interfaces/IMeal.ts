import { IMealIngredient } from "./IMealIngredient";

export interface IMeal {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  ingredients: IMealIngredient[];
  CreatedBy: string;
  createdAt: Date;
  totalCalories: number;
}
