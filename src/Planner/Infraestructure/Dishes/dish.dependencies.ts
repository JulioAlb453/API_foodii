import { DishRepositoryMySQL } from "./Repositories/DishRepository.mysql";
import { DishService } from "../../application/Dishes/DishService";
import { DishController } from "./Controllers/DishControllers";

const dishRepo = new DishRepositoryMySQL();
const dishService = new DishService(dishRepo);
export const dishController = new DishController(dishService);
