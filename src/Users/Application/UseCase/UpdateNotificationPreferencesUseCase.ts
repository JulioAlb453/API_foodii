import { UserRepository } from "src/Users/Domain/Interfaces/UserRepository";
import { AppError } from "src/shared/Errors/AppErrors";
import { mapPreferenceStringsToSlugs } from "src/shared/Notifications/notificationCategorySlug";

export interface UpdateNotificationPreferencesRequest {
  userId: string;
  /** Etiquetas de la app y/o slugs técnicos; se persisten como slugs. */
  notificationCategoryPreferences: string[] | null;
  /** Si se omite, no se modifica el token. `null` limpia el token en BD. */
  fcmToken?: string | null;
}

export interface UpdateNotificationPreferencesResponse {
  id: string;
  notificationCategoryPreferences: string[] | null;
  fcmTokenUpdated: boolean;
}

export class UpdateNotificationPreferencesUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(
    request: UpdateNotificationPreferencesRequest
  ): Promise<UpdateNotificationPreferencesResponse> {
    const { userId, fcmToken } = request;

    if (!userId?.trim()) {
      throw new AppError("ID de usuario es requerido", 400);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    let slugs: string[] | null = null;
    if (
      request.notificationCategoryPreferences === null ||
      request.notificationCategoryPreferences === undefined
    ) {
      slugs = null;
    } else {
      slugs = mapPreferenceStringsToSlugs(request.notificationCategoryPreferences);
      if (slugs.length === 0) {
        slugs = null;
      }
    }

    await this.userRepository.updateNotificationPreferences(
      userId,
      slugs,
      fcmToken
    );

    return {
      id: userId,
      notificationCategoryPreferences: slugs,
      fcmTokenUpdated: fcmToken !== undefined,
    };
  }
}
