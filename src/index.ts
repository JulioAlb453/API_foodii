import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { getPool } from "src/Core/Infraestructure/Database/connection";
import { createAuthDependencies } from "src/Users/infrastructure/auth.dependencies";
import { UserRepositoryMySQL } from "src/Users/infrastructure/Repositories/UserRepository.mysql";
import { createAuthMiddleware } from "src/Core/Infraestructure/Middleware/auth.middleware";
import { createIngredientDependencies } from "src/Planner/Infraestructure/Ingredients/ingredient.dependencies";
import { IngredientRepositoryMySQL } from "src/Planner/Infraestructure/Ingredients/Repositories/IngredientRepository.mysql";
import { createMealDependencies } from "src/Planner/Infraestructure/Meals/meal.dependencies";
import { MealRepositoryMySQL } from "src/Planner/Infraestructure/Meals/Repositories/MealRepository.mysql";

const PORT = Number(process.env.PORT) || 3000;

const app = express();

app.use(cors());
app.use(express.json());

const pool = getPool();
const userRepository = new UserRepositoryMySQL(pool);
const ingredientRepository = new IngredientRepositoryMySQL(pool);
const mealRepository = new MealRepositoryMySQL(pool);

const { authController, tokenService } = createAuthDependencies({
  userRepository,
});

const { ingredientController } = createIngredientDependencies({
  ingredientRepository,
});
const { mealController } = createMealDependencies({
  mealRepository,
  ingredientRepository,
});

const authMiddleware = createAuthMiddleware(tokenService);

registerRoutes(app, {
  authController,
  mealController,
  ingredientController,
  authMiddleware,
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo`);
  console.log(`Puerto: ${PORT}`);
  console.log(`IP Pública: http://52.206.95.157:${PORT}`);
});