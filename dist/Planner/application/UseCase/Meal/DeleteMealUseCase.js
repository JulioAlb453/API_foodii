"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteMealUseCase = void 0;
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class DeleteMealUseCase {
    constructor(mealRepository) {
        this.mealRepository = mealRepository;
    }
    async execute(request) {
        const { id, userId } = request;
        if (!id || id.trim() === "") {
            throw new AppErrors_1.AppError("El ID de la comida es requerido", 400);
        }
        // Nota: El userId sigue siendo necesario si tu repositorio lo pide 
        // para el log o para la firma del método delete.
        if (!userId || userId.trim() === "") {
            throw new AppErrors_1.AppError("El ID del usuario es requerido", 400);
        }
        const meal = await this.mealRepository.findById(id);
        if (!meal) {
            throw new AppErrors_1.AppError("Comida no encontrada", 404);
        }
        // --- SE ELIMINÓ LA VALIDACIÓN DE PERMISOS (meal.CreatedBy !== userId) ---
        // Ahora cualquier usuario que envíe un userId válido podrá borrar el platillo.
        const deleted = await this.mealRepository.delete(id, userId);
        if (!deleted) {
            throw new AppErrors_1.AppError("No se pudo eliminar la comida", 500);
        }
        return {
            success: true,
            message: "Comida eliminada exitosamente",
            deletedMealId: id,
        };
    }
}
exports.DeleteMealUseCase = DeleteMealUseCase;
