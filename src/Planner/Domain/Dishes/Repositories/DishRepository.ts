import { Dish } from "../Dish";

export interface DishRepository {
  create(dish: Dish): Promise<Dish>;
  findById(id: string): Promise<Dish | null>;
  findAll(userId: string): Promise<Dish[]>;
  update(dish: Dish): Promise<Dish>;
  delete(id: string, userId: string): Promise<boolean>;
  getRandomDish(userId: string): Promise<Dish | null>;
}
