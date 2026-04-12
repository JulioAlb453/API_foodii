import { Meal } from "src/Planner/Domain/Entities/Meal";
import { MealRepository } from "src/Planner/Domain/interfaces/MealRepository";
import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { AppError } from "src/shared/Errors/AppErrors";
import { mapPreferenceStringsToSlugs } from "src/shared/Notifications/notificationCategorySlug";
import { normalizeMealSteps } from "./normalizeMealSteps";

interface CreateMealRequest {
  name: string;
  date: string;
  mealTime: string;
  ingredients: Array<{
    ingredientId: string;
    amount: number;
  }>;
  userId: string;
  image?: string | null;
  steps?: unknown;
  /** Slugs o etiquetas reconocidas por el servidor; vacío = sin categorías. */
  categories?: string[] | null;
}

interface MealIngredientResponse {
  ingredientId: string;
  amount: number;
  ingredientName: string;
  calories: number;
}

interface MealStepResponse {
  stepOrder: number;
  description: string;
}

interface CreateMealResponse {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  ingredients: MealIngredientResponse[];
  steps: MealStepResponse[];
  categories: string[];
  totalCalories: number;
  createdAt: Date;
  image?: string | null;
}

export class CreateMealUseCase {
  constructor(
    private mealRepository: MealRepository,
    private ingredientRepository: IngredientRepository,
  ) {}

  async execute(request: CreateMealRequest): Promise<CreateMealResponse> {
    const { name, date, mealTime, ingredients, userId, image } = request;
    const steps = normalizeMealSteps(request.steps);
    const categorySlugs = this.normalizeMealCategories(request.categories);

    if (!name || name.trim().length < 2) {
      throw new AppError(
        "El nombre de la comida debe tener al menos 2 caracteres",
        400,
      );
    }

    if (!["breakfast", "lunch", "dinner", "snack"].includes(mealTime)) {
      throw new AppError(
        "Hora de comida inválida. Debe ser: breakfast, lunch, dinner o snack",
        400,
      );
    }

    if (!ingredients || ingredients.length === 0) {
      throw new AppError("La comida debe tener al menos un ingrediente", 400);
    }

    const ingredientDetails: MealIngredientResponse[] = [];
    let totalCalories = 0;

    for (const item of ingredients) {
      if (item.amount <= 0) {
        throw new AppError(
          "La cantidad del ingrediente debe ser mayor que 0",
          400,
        );
      }

      const ingredient = await this.ingredientRepository.findById(
        item.ingredientId,
      );
      if (!ingredient) {
        throw new AppError(
          `Ingrediente con ID ${item.ingredientId} no encontrado`,
          404,
        );
      }

      const calories = (ingredient.caloriesPer100g * item.amount) / 100;

      ingredientDetails.push({
        ingredientId: item.ingredientId,
        amount: item.amount,
        ingredientName: ingredient.name,
        calories,
      });

      totalCalories += calories;
    }

    const meal = Meal.create({
      id: crypto.randomUUID(),
      name: name.trim(),
      date: new Date(date),
      mealTime,
      ingredients: ingredients.map((item) => ({
        ingredientId: item.ingredientId,
        amount: item.amount,
      })),
      steps,
      categories: categorySlugs,
      CreatedBy: userId,
      createdAt: new Date(),
      totalCalories,
      image,
    });

    // Guardar la comida
    await this.mealRepository.create(meal);

    return {
      id: meal.id,
      name: meal.name,
      date: meal.date,
      mealTime: meal.mealTime,
      ingredients: ingredientDetails,
      steps: meal.steps.map((s) => ({
        stepOrder: s.stepOrder,
        description: s.description,
      })),
      categories: meal.categories,
      totalCalories,
      createdAt: meal.createdAt,
      image: meal.image,
    };
  }

  private normalizeMealCategories(raw: string[] | null | undefined): string[] {
    if (raw == null || raw.length === 0) {
      return [];
    }
    return mapPreferenceStringsToSlugs(raw);
  }
}
