"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIngredientDependencies = createIngredientDependencies;
const IngredientRepository_1 = require("src/Planner/Domain/interfaces/IngredientRepository");
const CreateIngredientUseCase_1 = require("src/Planner/application/UseCase/Ingredients/CreateIngredientUseCase");
const GetIngredientUseCase_1 = require("src/Planner/application/UseCase/Ingredients/GetIngredientUseCase");
const GetIngredientByIdUseCase_1 = require("src/Planner/application/UseCase/Ingredients/GetIngredientByIdUseCase");
const UpdateIngredientUseCase_1 = require("src/Planner/application/UseCase/Ingredients/UpdateIngredientUseCase");
const EliminateIngredientsUseCase_1 = require("src/Planner/application/UseCase/Ingredients/EliminateIngredientsUseCase");
const SearchIngredientUseCase_1 = require("src/Planner/application/UseCase/Ingredients/SearchIngredientUseCase");
const CalculateCaloriesUseCase_1 = require("src/Planner/application/UseCase/Ingredients/CalculateCaloriesUseCase");
const IngredientsController_1 = require("./Controllers/IngredientsController");
function createIngredientDependencies(options) {
    const ingredientRepository = options?.ingredientRepository ?? new IngredientRepository_1.IngredientRepositories();
    const createIngredientUseCase = new CreateIngredientUseCase_1.CreateIngredientUseCase(ingredientRepository);
    const getIngredientsUseCase = new GetIngredientUseCase_1.GetIngredientsUseCase(ingredientRepository);
    const getIngredientByIdUseCase = new GetIngredientByIdUseCase_1.GetIngredientByIdUseCase(ingredientRepository);
    const updateIngredientUseCase = new UpdateIngredientUseCase_1.UpdateIngredientUseCase(ingredientRepository);
    const deleteIngredientUseCase = new EliminateIngredientsUseCase_1.DeleteIngredientUseCase(ingredientRepository);
    const searchIngredientsUseCase = new SearchIngredientUseCase_1.SearchIngredientsUseCase(ingredientRepository);
    const calculateCaloriesUseCase = new CalculateCaloriesUseCase_1.CalculateCaloriesUseCase(ingredientRepository);
    const ingredientController = new IngredientsController_1.IngredientController(createIngredientUseCase, getIngredientsUseCase, getIngredientByIdUseCase, updateIngredientUseCase, deleteIngredientUseCase, searchIngredientsUseCase, calculateCaloriesUseCase);
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
