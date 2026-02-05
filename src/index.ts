import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { createAuthDependencies } from "src/Users/infrastructure/auth.dependencies";
import { createAuthMiddleware } from "src/Core/Infraestructure/Middleware/auth.middleware";
import { createIngredientDependencies } from "src/Planner/Infraestructure/Ingredients/ingredient.dependencies";
import { createMealDependencies } from "src/Planner/Infraestructure/Meals/meal.dependencies";

const PORT = Number(process.env.PORT) || 3000;

const app = express();

app.use(cors());
app.use(express.json());

// Dependencias Auth
const { authController, tokenService } = createAuthDependencies();

// Dependencias Ingredients y Meals (comparten ingredientRepository)
const { ingredientController, ingredientRepository } =
  createIngredientDependencies();
const { mealController } = createMealDependencies({ ingredientRepository });

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
