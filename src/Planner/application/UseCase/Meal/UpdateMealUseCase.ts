import { MealRepository } from "../../../Domain/interfaces/MealRepository";
import { Meal } from "../../../Domain/Entities/Meal";
import { IngredientRepository } from "../../../Domain/interfaces/IngredientRepository";
import { AppError } from "src/shared/Errors/AppErrors";

interface UpdateMealRequest {
  id: string;
  name?: string;
  date?: string;
  mealTime?: string;
  ingredients?: Array<{
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

interface UpdateMealResponse {
  id: string;
  name: string;
  date: Date;
  mealTime: string;
  ingredients: MealIngredientResponse[];
  totalCalories: number;
  createdAt: Date;
}

export class UpdateMealUseCase {
  constructor(
    private mealRepository: MealRepository,
    private ingredientRepository: IngredientRepository,
  ) {}

  async execute(request: UpdateMealRequest): Promise<UpdateMealResponse> {
    const { id, userId, name, date, mealTime, ingredients } = request;

    // Buscar la comida existente
    const existingMeal = await this.mealRepository.findById(id);

    if (!existingMeal) {
      throw new AppError("Comida no encontrada", 404);
    }

    // Verificar que la comida pertenece al usuario (Seguimos validando que no edites comidas de otros)
    if (existingMeal.CreatedBy !== userId) {
      throw new AppError("No tienes permiso para actualizar esta comida", 403);
    }

    // Preparar datos actualizados
    const updatedName = name?.trim() || existingMeal.name;
    const updatedDate = date ? new Date(date) : existingMeal.date;
    const updatedMealTime = mealTime || existingMeal.mealTime;
    const updatedIngredients = ingredients || existingMeal.ingredients;

    // Validaciones básicas
    if (updatedName.length < 2) {
      throw new AppError("El nombre debe tener al menos 2 caracteres", 400);
    }

    if (!["breakfast", "lunch", "dinner", "snack"].includes(updatedMealTime)) {
      throw new AppError("Hora de comida inválida", 400);
    }

    if (updatedIngredients.length === 0) {
      throw new AppError("La comida debe tener al menos un ingrediente", 400);
    }

    const ingredientDetails: MealIngredientResponse[] = [];
    let totalCalories = 0;

    for (const item of updatedIngredients) {
      if (item.amount <= 0) {
        throw new AppError("La cantidad debe ser mayor que 0", 400);
      }

      // Buscamos el ingrediente en el repositorio global
      const ingredient = await this.ingredientRepository.findById(item.ingredientId);
      
      if (!ingredient) {
        throw new AppError(`Ingrediente con ID ${item.ingredientId} no encontrado`, 404);
      }

      // --- SE ELIMINÓ LA VALIDACIÓN DE PROPIEDAD DEL INGREDIENTE ---
      // Ahora cualquier usuario puede usar ingredientes creados por otros.

      const calories = (ingredient.caloriesPer100g * item.amount) / 100;

      ingredientDetails.push({
        ingredientId: item.ingredientId,
        amount: item.amount,
        ingredientName: ingredient.name,
        calories,
      });

      totalCalories += calories;
    }

    const updatedMeal = Meal.create({
      id: existingMeal.id,
      name: updatedName,
      date: updatedDate,
      mealTime: updatedMealTime,
      ingredients: updatedIngredients,
      CreatedBy: userId,
      createdAt: existingMeal.createdAt,
      totalCalories,
    });

    await this.mealRepository.create(updatedMeal);

    return {
      id: updatedMeal.id,
      name: updatedMeal.name,
      date: updatedMeal.date,
      mealTime: updatedMeal.mealTime,
      ingredients: ingredientDetails,
      totalCalories,
      createdAt: updatedMeal.createdAt,
    };
  }
}