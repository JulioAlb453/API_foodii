import { User } from "../Entities/User";

export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;

  assignFcmTokenExclusive(userId: string, fcmToken: string): Promise<void>;

  /**
   * Persiste preferencias como JSON array de slugs.
   * @param fcmToken `undefined` = no cambiar; `null` = borrar; string = asignar (exclusivo por token).
   */
  updateNotificationPreferences(
    userId: string,
    categorySlugs: string[] | null,
    fcmToken?: string | null
  ): Promise<void>;
}

export class UserRepositories implements UserRepository {
  private users: Map<string, User> = new Map();

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const normalizedUsername = username.toLowerCase().trim();

    for (const user of this.users.values()) {
      if (user.username === normalizedUsername) {
        return user;
      }
    }

    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async assignFcmTokenExclusive(userId: string, fcmToken: string): Promise<void> {
    for (const u of this.users.values()) {
      if (u.id !== userId && u.fcmToken === fcmToken) {
        u.fcmToken = null;
      }
    }
    const user = this.users.get(userId);
    if (user) {
      user.fcmToken = fcmToken;
    }
  }

  async updateNotificationPreferences(
    userId: string,
    categorySlugs: string[] | null,
    fcmToken?: string | null
  ): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;
    user.notificationCategoryPreferences = categorySlugs;
    user.updatedAt = new Date();
    if (fcmToken !== undefined) {
      if (fcmToken === null) {
        user.fcmToken = null;
      } else {
        await this.assignFcmTokenExclusive(userId, fcmToken);
      }
    }
  }
}
