"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMealDependencies = createMealDependencies;
const MealRepository_1 = require("src/Planner/Domain/interfaces/MealRepository");
const IngredientRepository_1 = require("src/Planner/Domain/interfaces/IngredientRepository");
const CreateMealUseCase_1 = require("src/Planner/application/UseCase/Meal/CreateMealUseCase");
const GetMealUseCase_1 = require("src/Planner/application/UseCase/Meal/GetMealUseCase");
const GetMealById_1 = require("src/Planner/application/UseCase/Meal/GetMealById");
const UpdateMealUseCase_1 = require("src/Planner/application/UseCase/Meal/UpdateMealUseCase");
const DeleteMealUseCase_1 = require("src/Planner/application/UseCase/Meal/DeleteMealUseCase");
const CalCulateCaloriesUseCase_1 = require("src/Planner/application/UseCase/Meal/CalCulateCaloriesUseCase");
const GetMealsByDateRangeUseCase_1 = require("src/Planner/application/UseCase/Meal/GetMealsByDateRangeUseCase");
const MealControllers_1 = require("./Controllers/MealControllers");
function createMealDependencies(options) {
    const mealRepository = options?.mealRepository ?? new MealRepository_1.MealRepositories();
    const ingredientRepository = options?.ingredientRepository ?? new IngredientRepository_1.IngredientRepositories();
    const createMealUseCase = new CreateMealUseCase_1.CreateMealUseCase(mealRepository, ingredientRepository);
    const getMealsUseCase = new GetMealUseCase_1.GetMealsUseCase(mealRepository, ingredientRepository);
    const getMealByIdUseCase = new GetMealById_1.GetMealByIdUseCase(mealRepository, ingredientRepository);
    const updateMealUseCase = new UpdateMealUseCase_1.UpdateMealUseCase(mealRepository, ingredientRepository);
    const deleteMealUseCase = new DeleteMealUseCase_1.DeleteMealUseCase(mealRepository);
    const calculateCaloriesUseCase = new CalCulateCaloriesUseCase_1.CalculateCaloriesUseCase(mealRepository);
    const getMealsByDateRangeUseCase = new GetMealsByDateRangeUseCase_1.GetMealsByDateRangeUseCase(mealRepository, ingredientRepository);
    const mealController = new MealControllers_1.MealController(createMealUseCase, getMealsUseCase, getMealByIdUseCase, updateMealUseCase, deleteMealUseCase, calculateCaloriesUseCase, getMealsByDateRangeUseCase);
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
