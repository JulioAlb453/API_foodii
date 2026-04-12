import { AppError } from "src/shared/Errors/AppErrors";


export const NOTIFICATION_CATEGORY_SLUGS = [
  "fitness",
  "high_protein",
  "low_calorie",
  "low_carb",
  "vegan",
  "quick_meals",
  "meal_prep",
  "family_friendly",
  "budget_friendly",
  "gluten_free",
  "balanced",
  "healthy_snacks",
  "international",
] as const;

export type NotificationCategorySlug =
  (typeof NOTIFICATION_CATEGORY_SLUGS)[number];

const SLUG_SET = new Set<string>(NOTIFICATION_CATEGORY_SLUGS);

const LEGACY_SLUGS = new Set<string>([
  "quesadillas",
  "seafood",
  "antojitos",
  "desserts",
]);

const ALL_ACCEPTED_SLUGS = new Set<string>([
  ...NOTIFICATION_CATEGORY_SLUGS,
  ...LEGACY_SLUGS,
]);

/**
 * Etiquetas sugeridas en la app (español) → slug.
 * Incluye variantes sin tilde por teclado / copia.
 */
const LABEL_TO_SLUG = new Map<string, string>([
  ["Fitness", "fitness"],
  ["Fitness 💪", "fitness"],
  ["Alto en proteína", "high_protein"],
  ["Alto en proteina", "high_protein"],
  ["Bajo en calorías", "low_calorie"],
  ["Bajo en calorias", "low_calorie"],
  ["Bajo en carbohidratos", "low_carb"],
  ["Bajo en carbos", "low_carb"],
  ["Vegano", "vegan"],
  ["Plant-based", "vegan"],
  ["Plant based", "vegan"],
  ["Comidas rápidas", "quick_meals"],
  ["Rápido de preparar", "quick_meals"],
  ["Rapido de preparar", "quick_meals"],
  ["Meal prep", "meal_prep"],
  ["Preparación por adelantado", "meal_prep"],
  ["Preparacion por adelantado", "meal_prep"],
  ["Para la familia", "family_friendly"],
  ["Económico", "budget_friendly"],
  ["Economico", "budget_friendly"],
  ["Bueno para el presupuesto", "budget_friendly"],
  ["Sin gluten", "gluten_free"],
  ["Equilibrado", "balanced"],
  ["Comida equilibrada", "balanced"],
  ["Snacks saludables", "healthy_snacks"],
  ["Internacional", "international"],
  ["Cocina internacional", "international"],
]);

function mapSinglePreference(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.length) {
    throw new AppError("Las categorías no pueden ser cadenas vacías", 400);
  }

  const fromLabel = LABEL_TO_SLUG.get(trimmed);
  if (fromLabel) return fromLabel;

  const asSlug = trimmed.toLowerCase().replace(/\s+/g, "_");
  if (ALL_ACCEPTED_SLUGS.has(asSlug)) return asSlug;

  throw new AppError(
    `Categoría no reconocida: "${raw}". Usa una etiqueta de la app o un slug canónico: ${NOTIFICATION_CATEGORY_SLUGS.join(", ")}`,
    400
  );
}


export function mapPreferenceStringsToSlugs(categories: string[]): string[] {
  if (!Array.isArray(categories)) {
    throw new AppError(
      "notificationCategoryPreferences debe ser un array de strings",
      400
    );
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of categories) {
    if (typeof item !== "string") {
      throw new AppError(
        "Cada categoría en notificationCategoryPreferences debe ser texto",
        400
      );
    }
    const slug = mapSinglePreference(item);
    if (!seen.has(slug)) {
      seen.add(slug);
      out.push(slug);
    }
  }
  return out;
}
