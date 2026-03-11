"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MealController = void 0;
class MealController {
    constructor(createMealUseCase, getMealsUseCase, getMealByIdUseCase, updateMealUseCase, deleteMealUseCase, calculateCaloriesUseCase, getMealsByDateRangeUseCase) {
        this.createMealUseCase = createMealUseCase;
        this.getMealsUseCase = getMealsUseCase;
        this.getMealByIdUseCase = getMealByIdUseCase;
        this.updateMealUseCase = updateMealUseCase;
        this.deleteMealUseCase = deleteMealUseCase;
        this.calculateCaloriesUseCase = calculateCaloriesUseCase;
        this.getMealsByDateRangeUseCase = getMealsByDateRangeUseCase;
    }
    async create(req, res) {
        try {
            const { userId, name, date, mealTime, ingredients } = req.body;
            if (!userId || !name || !date || !mealTime || !ingredients) {
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
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                error: error.message,
            });
        }
    }
    async getAll(req, res) {
        try {
            const { date } = req.query;
            const result = await this.getMealsUseCase.execute({
                date: date,
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                error: error.message,
            });
        }
    }
    async getById(req, res) {
        try {
            const userId = req.user.id;
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
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                error: error.message,
            });
        }
    }
    async update(req, res) {
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
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                error: error.message,
            });
        }
    }
    async delete(req, res) {
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
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                error: error.message,
            });
        }
    }
    async getCaloriesSummary(req, res) {
        try {
            const userId = req.user.id;
            const { date } = req.query;
            const result = await this.calculateCaloriesUseCase.execute({
                userId,
                date: date,
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                error: error.message,
            });
        }
    }
    async getByDateRange(req, res) {
        try {
            const userId = req.user.id;
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
                startDate: startDate,
                endDate: endDate,
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                error: error.message,
            });
        }
    }
}
exports.MealController = MealController;
