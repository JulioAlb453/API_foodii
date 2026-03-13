import { Dish } from "../../Domain/Dishes/Dish";
import { DishRepository } from "../../Domain/Dishes/Repositories/DishRepository";

export class DishService {
  constructor(private dishRepo: DishRepository) {}

  async createDish(
    name: string,
    description: string | null,
    calories: number,
    image: string | null,
    userId: string
  ): Promise<Dish> {
    const dish = Dish.create({
      name,
      description,
      calories,
      image,
      createdBy: userId,
    });
    return await this.dishRepo.create(dish);
  }

  async getDishById(id: string): Promise<Dish | null> {
    return await this.dishRepo.findById(id);
  }

  async getAllDishes(userId: string): Promise<Dish[]> {
    return await this.dishRepo.findAll(userId);
  }

  async updateDish(
    id: string,
    userId: string,
    name?: string,
    description?: string | null,
    calories?: number,
    image?: string | null
  ): Promise<Dish | null> {
    const existing = await this.dishRepo.findById(id);
    if (!existing || existing.createdBy !== userId) {
      return null;
    }

    if (name !== undefined) existing.name = name;
    if (description !== undefined) existing.description = description;
    if (calories !== undefined) existing.calories = calories;
    if (image !== undefined) existing.image = image;

    return await this.dishRepo.update(existing);
  }

  async deleteDish(id: string, userId: string): Promise<boolean> {
    return await this.dishRepo.delete(id, userId);
  }

  async getRandomDish(userId: string): Promise<Dish | null> {
    return await this.dishRepo.getRandomDish(userId);
  }
}
