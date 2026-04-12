import { IMealIngredient } from "./IMealIngredient";
import { IMealStep } from "./IMealStep";

export interface IMeal {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  ingredients: IMealIngredient[];
  steps: IMealStep[];
  /** Slugs de categoría (mismo vocabulario que notificaciones / FCM). */
  categories: string[];
  CreatedBy: string;
  createdAt: Date;
  totalCalories: number;
  image?: string | null;
}
