import { Request, Response } from "express";
import { GetIngredientByIdUseCase } from "src/Planner/application/UseCase/Ingredients/GetIngredientByIdUseCase";
import { CreateIngredientUseCase } from "src/Planner/application/UseCase/Ingredients/CreateIngredientUseCase";
import { DeleteIngredientUseCase } from "src/Planner/application/UseCase/Ingredients/EliminateIngredientsUseCase";
import { GetIngredientsUseCase } from "src/Planner/application/UseCase/Ingredients/GetIngredientUseCase";
import { SearchIngredientsUseCase } from "src/Planner/application/UseCase/Ingredients/SearchIngredientUseCase";
import { UpdateIngredientUseCase } from "src/Planner/application/UseCase/Ingredients/UpdateIngredientUseCase";
import { CalculateCaloriesUseCase } from "src/Planner/application/UseCase/Ingredients/CalculateCaloriesUseCase";

export class IngredientController {
  constructor(
    private createIngredientUseCase: CreateIngredientUseCase,
    private getIngredientsUseCase: GetIngredientsUseCase,
    private getIngredientByIdUseCase: GetIngredientByIdUseCase,
    private updateIngredientUseCase: UpdateIngredientUseCase,
    private deleteIngredientUseCase: DeleteIngredientUseCase,
    private searchIngredientsUseCase: SearchIngredientsUseCase,
    private calculateCaloriesUseCase: CalculateCaloriesUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { name, caloriesPer100g } = req.body;

      // Validaciones básicas
      if (!name || caloriesPer100g === undefined) {
        res.status(400).json({
          success: false,
          error: "Name y caloriesPer100g son requeridos",
        });
        return;
      }

      const result = await this.createIngredientUseCase.execute({
        name,
        caloriesPer100g,
        userId,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { search } = req.query;

      const result = await this.getIngredientsUseCase.execute({
        userId,
        search: search as string,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const ingredientId = Array.isArray(id) ? id[0] : id;

      const result = await this.getIngredientByIdUseCase.execute({
        id: ingredientId,
        userId,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { name, caloriesPer100g } = req.body;
      const ingredientId = Array.isArray(id) ? id[0] : id;

      const result = await this.updateIngredientUseCase.execute({
        id: ingredientId,
        name,
        caloriesPer100g,
        userId,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const ingredientId = Array.isArray(id) ? id[0] : id;

      const result = await this.deleteIngredientUseCase.execute({
        id: ingredientId,
        userId,
      });

      res.status(200).json({
        success: true,
        data: { deleted: result },
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { q, limit } = req.query;

      if (!q || (q as string).trim().length < 2) {
        res.status(200).json({
          success: true,
          data: [],
        });
        return;
      }

      const result = await this.searchIngredientsUseCase.execute({
        userId,
        query: q as string,
        limit: limit ? parseInt(limit as string) : 10,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  async calculateCalories(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { ingredientId, amount } = req.body;

      // Validaciones básicas
      if (!ingredientId || amount === undefined) {
        res.status(400).json({
          success: false,
          error: "ingredientId y amount son requeridos",
        });
        return;
      }

      const result = await this.calculateCaloriesUseCase.execute({
        ingredientId,
        amount,
        userId,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  async calculateBulkCalories(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { ingredients } = req.body;

      // Validaciones básicas
      if (!ingredients || !Array.isArray(ingredients)) {
        res.status(400).json({
          success: false,
          error: "ingredients (array) es requerido",
        });
        return;
      }

      // Usaremos el mismo caso de uso para simplificar
      const calculations = [];
      let totalCalories = 0;

      for (const item of ingredients) {
        if (!item.ingredientId || item.amount === undefined) {
          continue;
        }

        try {
          const result = await this.calculateCaloriesUseCase.execute({
            ingredientId: item.ingredientId,
            amount: item.amount,
            userId,
          });

          calculations.push(result);
          totalCalories += result.calculatedCalories;
        } catch (error) {
          // Continuar con otros ingredientes
        }
      }

      res.status(200).json({
        success: true,
        data: {
          ingredients: calculations,
          totalCalories,
        },
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }
}
