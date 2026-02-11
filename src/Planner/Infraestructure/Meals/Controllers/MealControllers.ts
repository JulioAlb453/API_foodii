import { Request, Response } from "express";

import { CreateMealUseCase } from "src/Planner/application/UseCase/Meal/CreateMealUseCase";
import { GetMealByIdUseCase } from "src/Planner/application/UseCase/Meal/GetMealById";
import { UpdateMealUseCase } from "src/Planner/application/UseCase/Meal/UpdateMealUseCase";
import { DeleteMealUseCase } from "src/Planner/application/UseCase/Meal/DeleteMealUseCase";
import { CalculateCaloriesUseCase } from "src/Planner/application/UseCase/Meal/CalCulateCaloriesUseCase";
import { GetMealsByDateRangeUseCase } from "src/Planner/application/UseCase/Meal/GetMealsByDateRangeUseCase";
import { GetMealsUseCase } from "src/Planner/application/UseCase/Meal/GetMealUseCase";

export class MealController {
  constructor(
    private createMealUseCase: CreateMealUseCase,
    private getMealsUseCase: GetMealsUseCase,
    private getMealByIdUseCase: GetMealByIdUseCase,
    private updateMealUseCase: UpdateMealUseCase,
    private deleteMealUseCase: DeleteMealUseCase,
    private calculateCaloriesUseCase: CalculateCaloriesUseCase,
    private getMealsByDateRangeUseCase: GetMealsByDateRangeUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { name, date, mealTime, ingredients } = req.body;

      if (!name || !date || !mealTime || !ingredients) {
        res.status(400).json({
          success: false,
          error: "name, date, mealTime y ingredients son requeridos",
        });
        return;
      }

      const result = await this.createMealUseCase.execute({
        name,
        date,
        mealTime,
        ingredients,
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
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
        });
        return;
      }
      const { date } = req.query;

      const result = await this.getMealsUseCase.execute({
        userId,
        date: date as string,
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
      const mealId = Array.isArray(id) ? id[0] : id;

      const result = await this.getMealByIdUseCase.execute({
        id: mealId,
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
      const userId = req.body.userId;
      const { id } = req.params;
      const { name, date, mealTime, ingredients } = req.body;
      const mealId = Array.isArray(id) ? id[0] : id;

      const result = await this.updateMealUseCase.execute({
        id: mealId,
        name,
        date,
        mealTime,
        ingredients,
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
      const mealId = Array.isArray(id) ? id[0] : id;

      const result = await this.deleteMealUseCase.execute({
        id: mealId,
        userId,
      });

      if (!mealId) {
        res.status(400).json({
          success: false,
          error: "ID de la comida es requerido",
        });
        return;
      }

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

  async getCaloriesSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { date } = req.query;
      

      const result = await this.calculateCaloriesUseCase.execute({
        userId,
        date: date as string,
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

  async getByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: "startDate y endDate son requeridos",
        });
        return;
      }

      const result = await this.getMealsByDateRangeUseCase.execute({
        userId,
        startDate: startDate as string,
        endDate: endDate as string,
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
}
