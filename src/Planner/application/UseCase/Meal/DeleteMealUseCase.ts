import { MealRepository } from "src/Planner/Domain/interfaces/MealRepository";
import { AppError } from "src/shared/Errors/AppErrors";

interface DeleteMealRequest {
  id: string;
  userId: string;
}

interface DeleteMealResponse {
  success: boolean;
  message: string;
  deletedMealId: string;
}

export class DeleteMealUseCase {
  constructor(private mealRepository: MealRepository) {}

  async execute(request: DeleteMealRequest): Promise<DeleteMealResponse> {
    const { id, userId } = request;

    if (!id || id.trim() === "") {
      throw new AppError("El ID de la comida es requerido", 400);
    }

    // Nota: El userId sigue siendo necesario si tu repositorio lo pide 
    // para el log o para la firma del método delete.
    if (!userId || userId.trim() === "") {
      throw new AppError("El ID del usuario es requerido", 400);
    }

    const meal = await this.mealRepository.findById(id);

    if (!meal) {
      throw new AppError("Comida no encontrada", 404);
    }

    // --- SE ELIMINÓ LA VALIDACIÓN DE PERMISOS (meal.CreatedBy !== userId) ---
    // Ahora cualquier usuario que envíe un userId válido podrá borrar el platillo.

    const deleted = await this.mealRepository.delete(id, userId);

    if (!deleted) {
      throw new AppError("No se pudo eliminar la comida", 500);
    }

    return {
      success: true,
      message: "Comida eliminada exitosamente",
      deletedMealId: id,
    };
  }
}