import { IMealStep } from "src/Planner/Domain/interfaces/IMealStep";
import { AppError } from "src/shared/Errors/AppErrors";

const MAX_STEPS = 50;
const MAX_STEP_LENGTH = 8000;

export function normalizeMealSteps(raw: unknown): IMealStep[] {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (!Array.isArray(raw)) {
    throw new AppError("steps debe ser un arreglo", 400);
  }
  if (raw.length > MAX_STEPS) {
    throw new AppError(`Máximo ${MAX_STEPS} pasos por comida`, 400);
  }

  const out: IMealStep[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    let description: string;

    if (typeof item === "string") {
      description = item;
    } else if (
      item !== null &&
      typeof item === "object" &&
      "description" in item &&
      typeof (item as { description: unknown }).description === "string"
    ) {
      description = (item as { description: string }).description;
    } else {
      throw new AppError(
        "Cada paso debe ser un texto o un objeto { description: string }",
        400,
      );
    }

    const trimmed = description.trim();
    if (trimmed.length === 0) {
      throw new AppError("Los pasos no pueden estar vacíos", 400);
    }
    if (trimmed.length > MAX_STEP_LENGTH) {
      throw new AppError(
        `Cada paso admite como máximo ${MAX_STEP_LENGTH} caracteres`,
        400,
      );
    }

    out.push({ stepOrder: i + 1, description: trimmed });
  }

  return out;
}
