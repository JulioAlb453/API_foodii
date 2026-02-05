import { Meal } from "src/Planner/Domain/Entities/Meal";
import { MealRepository } from "src/Planner/Domain/interfaces/MealRepository";
import { IngredientRepository } from "src/Planner/Domain/interfaces/IngredientRepository";
import { AppError } from "@shared/Errors/AppErrors";

interface CreateMealRequest {
  name: string;
  date: string;
  mealTime: string;
  ingredients: Array<{
    ingredientId: string;
    amount: number;
  }>;
  userId: string;
}

interface MealIngredientResponse {
  ingredientId: string;
  amount: number;
  ingredientName: string;
  calories: number;
}

interface CreateMealResponse {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  ingredients: MealIngredientResponse[];
  totalCalories: number;
  createdAt: Date;
}

export class CreateMealUseCase {
  constructor(
    private mealRepository: MealRepository,
    private ingredientRepository: IngredientRepository,
  ) {}

  async execute(request: CreateMealRequest): Promise<CreateMealResponse> {
    const { name, date, mealTime, ingredients, userId } = request;

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

      if (ingredient.createdBy !== userId) {
        throw new AppError("Solo puedes usar tus propios ingredientes", 403);
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

    // Crear la comida
    const meal = Meal.create({
      id: crypto.randomUUID(),
      name: name.trim(),
      date: new Date(date),
      mealTime,
      ingredients: ingredients.map((item) => ({
        ingredientId: item.ingredientId,
        amount: item.amount,
      })),
      CreatedBy: userId,
      createdAt: new Date(),
      totalCalories,
    });

    // Guardar la comida
    await this.mealRepository.create(meal);

    return {
      id: meal.id,
      name: meal.name,
      date: meal.date,
      mealTime: meal.mealTime,
      ingredients: ingredientDetails,
      totalCalories,
      createdAt: meal.createdAt,
    };
  }
}
