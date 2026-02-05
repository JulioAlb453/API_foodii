import {
  IngredientRepository,
  IngredientRepositories,
} from "src/Planner/Domain/interfaces/IngredientRepository";
import { CreateIngredientUseCase } from "src/Planner/application/UseCase/Ingredients/CreateIngredientUseCase";
import { GetIngredientsUseCase } from "src/Planner/application/UseCase/Ingredients/GetIngredientUseCase";
import { GetIngredientByIdUseCase } from "src/Planner/application/UseCase/Ingredients/GetIngredientByIdUseCase";
import { UpdateIngredientUseCase } from "src/Planner/application/UseCase/Ingredients/UpdateIngredientUseCase";
import { DeleteIngredientUseCase } from "src/Planner/application/UseCase/Ingredients/EliminateIngredientsUseCase";
import { SearchIngredientsUseCase } from "src/Planner/application/UseCase/Ingredients/SearchIngredientUseCase";
import { CalculateCaloriesUseCase } from "src/Planner/application/UseCase/Ingredients/CalculateCaloriesUseCase";
import { IngredientController } from "./Controllers/IngredientsController";

export interface IngredientDependenciesOptions {
  ingredientRepository?: IngredientRepository;
}

export function createIngredientDependencies(
  options?: IngredientDependenciesOptions
) {
  const ingredientRepository =
    options?.ingredientRepository ?? new IngredientRepositories();

  const createIngredientUseCase = new CreateIngredientUseCase(
    ingredientRepository
  );
  const getIngredientsUseCase = new GetIngredientsUseCase(ingredientRepository);
  const getIngredientByIdUseCase = new GetIngredientByIdUseCase(
    ingredientRepository
  );
  const updateIngredientUseCase = new UpdateIngredientUseCase(
    ingredientRepository
  );
  const deleteIngredientUseCase = new DeleteIngredientUseCase(
    ingredientRepository
  );
  const searchIngredientsUseCase = new SearchIngredientsUseCase(
    ingredientRepository
  );
  const calculateCaloriesUseCase = new CalculateCaloriesUseCase(
    ingredientRepository
  );

  const ingredientController = new IngredientController(
    createIngredientUseCase,
    getIngredientsUseCase,
    getIngredientByIdUseCase,
    updateIngredientUseCase,
    deleteIngredientUseCase,
    searchIngredientsUseCase,
    calculateCaloriesUseCase
  );

  return {
    ingredientController,
    ingredientRepository,
    createIngredientUseCase,
    getIngredientsUseCase,
    getIngredientByIdUseCase,
    updateIngredientUseCase,
    deleteIngredientUseCase,
    searchIngredientsUseCase,
    calculateCaloriesUseCase,
  };
}
