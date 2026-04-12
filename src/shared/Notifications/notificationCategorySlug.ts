import { AppError } from "src/shared/Errors/AppErrors";

export const NOTIFICATION_CATEGORY_SLUGS = [
  "fitness",
  "quesadillas",
  "low_calorie",
  "vegan",
  "seafood",
  "antojitos",
  "desserts",
  "international",
] as const;

export type NotificationCategorySlug =
  (typeof NOTIFICATION_CATEGORY_SLUGS)[number];

const SLUG_SET = new Set<string>(NOTIFICATION_CATEGORY_SLUGS);

const LABEL_TO_SLUG = new Map<string, string>([
  ["Fitness 💪", "fitness"],
  ["Quesadillas 🌮", "quesadillas"],
  ["Bajo en calorías 🥗", "low_calorie"],
  ["Vegano 🌿", "vegan"],
  ["Mariscos 🦐", "seafood"],
  ["Antojitos 🌯", "antojitos"],
  ["Postres 🍰", "desserts"],
  ["Internacional 🌎", "international"],
]);

function mapSinglePreference(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.length) {
    throw new AppError("Las categorías no pueden ser cadenas vacías", 400);
  }

  const fromLabel = LABEL_TO_SLUG.get(trimmed);
  if (fromLabel) return fromLabel;

  const asSlug = trimmed.toLowerCase().replace(/\s+/g, "_");
  if (SLUG_SET.has(asSlug)) return asSlug;

  throw new AppError(
    `Categoría no reconocida: "${raw}". Envía la etiqueta exacta de la app o uno de los slugs: ${NOTIFICATION_CATEGORY_SLUGS.join(", ")}`,
    400
  );
}

/**
 * Convierte la lista enviada por el cliente (etiquetas y/o slugs) en slugs únicos
 * almacenables en BD y alineables con `FirebaseMessaging.subscribeToTopic(slug)`.
 */
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
