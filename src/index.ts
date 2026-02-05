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

// Pool MySQL (usa variables DB_* de .env)
const pool = getPool();
const userRepository = new UserRepositoryMySQL(pool);
const ingredientRepository = new IngredientRepositoryMySQL(pool);
const mealRepository = new MealRepositoryMySQL(pool);

// Dependencias Auth (con repositorio MySQL)
const { authController, tokenService } = createAuthDependencies({
  userRepository,
});

// Dependencias Ingredients y Meals (repositorios MySQL)
const { ingredientController } = createIngredientDependencies({
  ingredientRepository,
});
const { mealController } = createMealDependencies({
  mealRepository,
  ingredientRepository,
});

// Middleware de autenticación
const authMiddleware = createAuthMiddleware(tokenService);

// Registrar todas las rutas
registerRoutes(app, {
  authController,
  mealController,
  ingredientController,
  authMiddleware,
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Auth health: http://localhost:${PORT}/api/auth/health`);
});
