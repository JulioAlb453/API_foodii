import { Express, RequestHandler } from "express";
import { AuthController } from "src/Users/infrastructure/Controllers/UsersController";
import { MealController } from "src/Planner/Infraestructure/Meals/Controllers/MealControllers";
import { IngredientController } from "src/Planner/Infraestructure/Ingredients/Controllers/IngredientsController";

export interface RouteDependencies {
  authController: AuthController;
  mealController: MealController;
  ingredientController: IngredientController;
  authMiddleware: RequestHandler;
}

export function registerRoutes(app: Express, deps: RouteDependencies): void {
  const {
    authController,
    mealController,
    ingredientController,
    authMiddleware,
  } = deps;

  // ----- Auth (Users) -----
  app.post("/api/auth/register", (req, res) =>
    authController.register(req, res)
  );
  app.post("/api/auth/login", (req, res) => authController.login(req, res));
  app.post("/api/auth/verify-token", (req, res) =>
    authController.verifyTokenFromBody(req, res)
  );
  app.get("/api/auth/health", (req, res) =>
    authController.authHealth(req, res)
  );

  app.get("/api/auth/profile", authMiddleware, (req, res) =>
    authController.getProfile(req, res)
  );
  app.put("/api/auth/profile", authMiddleware, (req, res) =>
    authController.updateProfile(req, res)
  );
  app.get("/api/auth/verify-token", authMiddleware, (req, res) =>
    authController.verifyToken(req, res)
  );
  app.delete("/api/auth/account", authMiddleware, (req, res) =>
    authController.deleteAccount(req, res)
  );
  app.post("/api/auth/logout", authMiddleware, (req, res) =>
    authController.logout(req, res)
  );

  // ----- Meals (requieren Authorization: Bearer <token>) -----
  app.post("/api/meals", authMiddleware, (req, res) =>
    mealController.create(req, res)
  );
  app.get("/api/meals", authMiddleware, (req, res) =>
    mealController.getAll(req, res)
  );
  app.get("/api/meals/calories-summary", authMiddleware, (req, res) =>
    mealController.getCaloriesSummary(req, res)
  );
  app.get("/api/meals/date-range", authMiddleware, (req, res) =>
    mealController.getByDateRange(req, res)
  );
  app.get("/api/meals/:id", authMiddleware, (req, res) =>
    mealController.getById(req, res)
  );
  app.put("/api/meals/:id", authMiddleware, (req, res) =>
    mealController.update(req, res)
  );
  app.delete("/api/meals/:id", authMiddleware, (req, res) =>
    mealController.delete(req, res)
  );

  // ----- Ingredients (requieren Authorization: Bearer <token>) -----
  app.post("/api/ingredients", authMiddleware, (req, res) =>
    ingredientController.create(req, res)
  );
  app.get("/api/ingredients", authMiddleware, (req, res) =>
    ingredientController.getAll(req, res)
  );
  app.get("/api/ingredients/search", authMiddleware, (req, res) =>
    ingredientController.search(req, res)
  );
  app.post("/api/ingredients/calculate-calories", authMiddleware, (req, res) =>
    ingredientController.calculateCalories(req, res)
  );
  app.post(
    "/api/ingredients/calculate-bulk-calories",
    authMiddleware,
    (req, res) => ingredientController.calculateBulkCalories(req, res)
  );
  app.get("/api/ingredients/:id", authMiddleware, (req, res) =>
    ingredientController.getById(req, res)
  );
  app.put("/api/ingredients/:id", authMiddleware, (req, res) =>
    ingredientController.update(req, res)
  );
  app.delete("/api/ingredients/:id", authMiddleware, (req, res) =>
    ingredientController.delete(req, res)
  );
}
