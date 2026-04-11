import { IMealIngredient } from "./IMealIngredient";
import { IMealStep } from "./IMealStep";

export interface IMeal {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  ingredients: IMealIngredient[];
  steps: IMealStep[];
  CreatedBy: string;
  createdAt: Date;
  totalCalories: number;
  image?: string | null;
}
