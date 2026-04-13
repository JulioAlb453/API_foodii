"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
require("module-alias/register");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
/**
 * Carga `.env` desde el cwd de PM2 o, si no existe, desde la raíz del proyecto (útil con `dist/`).
 * `override: true`: si PM2 exporta `ADMIN_PUSH_SECRET=` vacío, sin esto dotenv NO sobrescribe y el push admin queda en 401.
 */
function loadEnvFile() {
    const fromCwd = path_1.default.resolve(process.cwd(), ".env");
    const fromAppDir = path_1.default.resolve(__dirname, "..", ".env");
    const envPath = fs_1.default.existsSync(fromCwd)
        ? fromCwd
        : fs_1.default.existsSync(fromAppDir)
            ? fromAppDir
            : null;
    if (!envPath) {
        console.warn(`[env] No se encontró .env (probado cwd: ${fromCwd} y app: ${fromAppDir})`);
        return;
    }
    dotenv_1.default.config({ path: envPath, override: true });
    console.log(`[env] Cargado: ${envPath}`);
}
loadEnvFile();
const routes_1 = require("./routes");
const connection_1 = require("src/Core/Infraestructure/Database/connection");
const auth_dependencies_1 = require("src/Users/infrastructure/auth.dependencies");
const UserRepository_mysql_1 = require("src/Users/infrastructure/Repositories/UserRepository.mysql");
const auth_middleware_1 = require("src/Core/Infraestructure/Middleware/auth.middleware");
const ingredient_dependencies_1 = require("src/Planner/Infraestructure/Ingredients/ingredient.dependencies");
const IngredientRepository_mysql_1 = require("src/Planner/Infraestructure/Ingredients/Repositories/IngredientRepository.mysql");
const meal_dependencies_1 = require("src/Planner/Infraestructure/Meals/meal.dependencies");
const MealRepository_mysql_1 = require("src/Planner/Infraestructure/Meals/Repositories/MealRepository.mysql");
const dish_dependencies_1 = require("src/Planner/Infraestructure/Dishes/dish.dependencies");
const notificationPush_dependencies_1 = require("src/Users/infrastructure/notificationPush.dependencies");
const PORT = Number(process.env.PORT) || 3000;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
const pool = (0, connection_1.getPool)();
const userRepository = new UserRepository_mysql_1.UserRepositoryMySQL(pool);
const ingredientRepository = new IngredientRepository_mysql_1.IngredientRepositoryMySQL(pool);
const mealRepository = new MealRepository_mysql_1.MealRepositoryMySQL(pool);
const { authController, tokenService } = (0, auth_dependencies_1.createAuthDependencies)({
    userRepository,
});
const { ingredientController } = (0, ingredient_dependencies_1.createIngredientDependencies)({
    ingredientRepository,
});
const { mealController } = (0, meal_dependencies_1.createMealDependencies)({
    mealRepository,
    ingredientRepository,
});
const authMiddleware = (0, auth_middleware_1.createAuthMiddleware)(tokenService);
const { notificationsController } = (0, notificationPush_dependencies_1.createNotificationPushDependencies)();
(0, routes_1.registerRoutes)(app, {
    authController,
    mealController,
    ingredientController,
    dishController: dish_dependencies_1.dishController,
    notificationsController,
    authMiddleware,
});
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor corriendo`);
    console.log(`Puerto: ${PORT}`);
    console.log(`IP Pública: http://52.206.95.157:${PORT}`);
    console.log(`[env] ADMIN_PUSH_SECRET: ${process.env.ADMIN_PUSH_SECRET?.trim() ? "definido" : "no definido"}`);
});
