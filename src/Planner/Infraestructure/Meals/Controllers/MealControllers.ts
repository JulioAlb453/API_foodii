import { Request, Response } from "express";

import { FcmPushPort } from "src/Core/Application/Ports/FcmPushPort.interface";
import { CreateMealUseCase } from "src/Planner/application/UseCase/Meal/CreateMealUseCase";
import { GetMealByIdUseCase } from "src/Planner/application/UseCase/Meal/GetMealById";
import { UpdateMealUseCase } from "src/Planner/application/UseCase/Meal/UpdateMealUseCase";
import { DeleteMealUseCase } from "src/Planner/application/UseCase/Meal/DeleteMealUseCase";
import { CalculateCaloriesUseCase } from "src/Planner/application/UseCase/Meal/CalCulateCaloriesUseCase";
import { GetMealsByDateRangeUseCase } from "src/Planner/application/UseCase/Meal/GetMealsByDateRangeUseCase";
import { GetMealsUseCase } from "src/Planner/application/UseCase/Meal/GetMealUseCase";
import { GetRandomMealUseCase } from "src/Planner/application/UseCase/Meal/GetRandomMealUseCase";

function parseStepsFromBody(body: Record<string, unknown>): unknown {
  if (!("steps" in body) || body.steps === undefined || body.steps === "") {
    return undefined;
  }
  const raw = body.steps;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }
  return raw;
}

/** Devuelve `undefined` si el cliente no envía la clave; si envía null o array, devuelve eso. */
function parseCategoriesFromBody(
  body: Record<string, unknown>
): string[] | null | undefined {
  if (!Object.prototype.hasOwnProperty.call(body, "categories")) {
    return undefined;
  }
  const raw = body.categories;
  if (raw === null) return null;
  if (raw === undefined || raw === "") return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) {
    return raw as string[];
  }
  return [];
}

export class MealController {
  constructor(
    private createMealUseCase: CreateMealUseCase,
    private getMealsUseCase: GetMealsUseCase,
    private getMealByIdUseCase: GetMealByIdUseCase,
    private updateMealUseCase: UpdateMealUseCase,
    private deleteMealUseCase: DeleteMealUseCase,
    private calculateCaloriesUseCase: CalculateCaloriesUseCase,
    private getMealsByDateRangeUseCase: GetMealsByDateRangeUseCase,
    private getRandomMealUseCase: GetRandomMealUseCase,
    private readonly fcmPushPort?: FcmPushPort
  ) {}


  private async notifyNewMealToCategoryTopics(params: {
    mealId: string;
    mealName: string;
    categorySlugs: string[] | undefined | null;
  }): Promise<void> {
    const fcm = this.fcmPushPort;
    if (!fcm?.isConfigured()) return;

    const { mealId, mealName, categorySlugs } = params;
    if (!categorySlugs?.length) return;

    const title = "¡Nueva receta para ti!";
    const body = `Se ha publicado: ${mealName}`;
    const data = {
      mealId: String(mealId),
      type: "NEW_MEAL",
    };

    const seen = new Set<string>();
    const slugs = categorySlugs
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0 && !seen.has(s) && (seen.add(s), true));

    const outcomes = await Promise.allSettled(
      slugs.map((topicSlug) =>
        fcm.sendToTopic({ topicSlug, title, body, data })
      )
    );
    outcomes.forEach((outcome, i) => {
      if (outcome.status === "rejected") {
        console.error(
          `[MealController] FCM sendToTopic falló (topic=${slugs[i]}):`,
          outcome.reason
        );
      }
    });
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, name, date, mealTime } = req.body;

      let ingredients = req.body.ingredients;
      if (typeof ingredients === "string") {
        ingredients = JSON.parse(ingredients);
      }

      if (!userId || !name || !date || !mealTime || !ingredients) {
        res.status(400).json({
          success: false,
          error: "name, date, mealTime y ingredients son requeridos",
        });
        return;
      }

      const image = req.file ? `/uploads/${req.file.filename}` : undefined;
      const steps = parseStepsFromBody(req.body as Record<string, unknown>);
      const categories = parseCategoriesFromBody(req.body as Record<string, unknown>);

      const result = await this.createMealUseCase.execute({
        name,
        date,
        mealTime,
        ingredients,
        userId,
        image,
        steps,
        ...(categories !== undefined ? { categories } : {}),
      });

      await this.notifyNewMealToCategoryTopics({
        mealId: result.id,
        mealName: result.name,
        categorySlugs: result.categories,
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
      
      const { date } = req.query;

      const result = await this.getMealsUseCase.execute({
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
      const { name, date, mealTime } = req.body;
      const mealId = Array.isArray(id) ? id[0] : id;

      let ingredients = req.body.ingredients;
      if (typeof ingredients === "string") {
        ingredients = JSON.parse(ingredients);
      }

      const image = req.file ? `/uploads/${req.file.filename}` : undefined;
      const body = req.body as Record<string, unknown>;
      const steps =
        "steps" in body ? parseStepsFromBody(body) : undefined;
      const categories = parseCategoriesFromBody(body);

      const result = await this.updateMealUseCase.execute({
        id: mealId,
        name,
        date,
        mealTime,
        ingredients,
        userId,
        image,
        ...(steps !== undefined ? { steps } : {}),
        ...(categories !== undefined ? { categories } : {}),
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
      const { id } = req.params;
      const { userId } = req.body;
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

  async getRandom(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      const result = await this.getRandomMealUseCase.execute(userId);

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
