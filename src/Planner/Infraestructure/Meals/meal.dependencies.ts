import { MealRepository, MealRepositories } from "src/Planner/Domain/interfaces/MealRepository";
import { IngredientRepository, IngredientRepositories } from "src/Planner/Domain/interfaces/IngredientRepository";
import { CreateMealUseCase } from "src/Planner/application/UseCase/Meal/CreateMealUseCase";
import { GetMealsUseCase } from "src/Planner/application/UseCase/Meal/GetMealUseCase";
import { GetMealByIdUseCase } from "src/Planner/application/UseCase/Meal/GetMealById";
import { UpdateMealUseCase } from "src/Planner/application/UseCase/Meal/UpdateMealUseCase";
import { DeleteMealUseCase } from "src/Planner/application/UseCase/Meal/DeleteMealUseCase";
import { CalculateCaloriesUseCase } from "src/Planner/application/UseCase/Meal/CalCulateCaloriesUseCase";
import { GetMealsByDateRangeUseCase } from "src/Planner/application/UseCase/Meal/GetMealsByDateRangeUseCase";
import { MealController } from "./Controllers/MealControllers";

export interface MealDependenciesOptions {
  mealRepository?: MealRepository;
  ingredientRepository?: IngredientRepository;
}

export function createMealDependencies(options?: MealDependenciesOptions) {
  const mealRepository = options?.mealRepository ?? new MealRepositories();
  const ingredientRepository =
    options?.ingredientRepository ?? new IngredientRepositories();

  const createMealUseCase = new CreateMealUseCase(
    mealRepository,
    ingredientRepository
  );
  const getMealsUseCase = new GetMealsUseCase(
    mealRepository,
    ingredientRepository
  );
  const getMealByIdUseCase = new GetMealByIdUseCase(
    mealRepository,
    ingredientRepository
  );
  const updateMealUseCase = new UpdateMealUseCase(
    mealRepository,
    ingredientRepository
  );
  const deleteMealUseCase = new DeleteMealUseCase(mealRepository);
  const calculateCaloriesUseCase = new CalculateCaloriesUseCase(mealRepository);
  const getMealsByDateRangeUseCase = new GetMealsByDateRangeUseCase(
    mealRepository,
    ingredientRepository
  );

  const mealController = new MealController(
    createMealUseCase,
    getMealsUseCase,
    getMealByIdUseCase,
    updateMealUseCase,
    deleteMealUseCase,
    calculateCaloriesUseCase,
    getMealsByDateRangeUseCase
  );

  return {
    mealController,
    mealRepository,
    ingredientRepository,
    createMealUseCase,
    getMealsUseCase,
    getMealByIdUseCase,
    updateMealUseCase,
    deleteMealUseCase,
    calculateCaloriesUseCase,
    getMealsByDateRangeUseCase,
  };
}
