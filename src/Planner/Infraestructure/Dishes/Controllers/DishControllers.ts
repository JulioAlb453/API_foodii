import { Request, Response } from "express";
import { DishService } from "../../../Application/Dishes/DishService";

export class DishController {
  constructor(private dishService: DishService) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, calories } = req.body;
      const userId = (req as any).user?.userId;
      // @ts-ignore
      const image = req.file ? `/uploads/${req.file.filename}` : null;

      if (!name || calories === undefined || !userId) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const dish = await this.dishService.createDish(
        name,
        description,
        Number(calories),
        image,
        userId
      );
      res.status(201).json(dish);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const dishes = await this.dishService.getAllDishes(userId);
      res.status(200).json(dishes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRandom(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const dish = await this.dishService.getRandomDish(userId);
      if (!dish) {
        res.status(404).json({ error: "No dishes found for this user" });
        return;
      }
      res.status(200).json(dish);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const dish = await this.dishService.getDishById(id as string);
      
      if (!dish || dish.createdBy !== userId) {
        res.status(404).json({ error: "Dish not found" });
        return;
      }
      
      res.status(200).json(dish);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const { name, description, calories } = req.body;
      // @ts-ignore
      const image = req.file ? `/uploads/${req.file.filename}` : undefined;

      const updated = await this.dishService.updateDish(
        id as string,
        userId,
        name,
        description,
        calories !== undefined ? Number(calories) : undefined,
        image
      );

      if (!updated) {
        res.status(404).json({ error: "Dish not found" });
        return;
      }

      res.status(200).json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const deleted = await this.dishService.deleteDish(id as string, userId);
      
      if (!deleted) {
        res.status(404).json({ error: "Dish not found" });
        return;
      }
      
      res.status(200).json({ message: "Dish deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
