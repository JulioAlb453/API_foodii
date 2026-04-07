import { randomUUID } from "crypto";
import { User } from "src/Users/Domain/Entities/User";
import { UserRepository } from "src/Users/Domain/Interfaces/UserRepository";
import { AppError } from "src/shared/Errors/AppErrors";
import { HashService } from "src/Core/Application/Ports/HashService.interface";
import { TokenService } from "src/Core/Application/Ports/TokenService.interface";

export interface RegisterUserRequest {
  username: string;
  password: string;
  notificationCategoryPreferences?: string[] | null;
}

export interface RegisterUserResponse {
  user: {
    id: string;
    username: string;
    createdAt: Date;
    notificationCategoryPreferences: string[] | null;
  };
  token: string;
  tokenExpiresIn: string;
}

export class RegisterUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService,
    private tokenService: TokenService
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    const { username, password, notificationCategoryPreferences } = request;

    this.validateInput(username, password);

    const cleanUsername = username.toLowerCase().trim();

    await this.ensureUsernameNotTaken(cleanUsername);

    const prefs = this.normalizeNotificationCategoryPreferences(
      notificationCategoryPreferences
    );

    const hashedPassword = await this.hashService.hash(password);
    const now = new Date();

    const user = User.create({
      id: randomUUID(),
      username: cleanUsername,
      password: hashedPassword,
      fcmToken: null,
      notificationCategoryPreferences: prefs,
      createdAt: now,
      updatedAt: now,
    });

    const savedUser = await this.userRepository.create(user);
    const token = this.tokenService.generate({
      id: savedUser.id,
      username: savedUser.username,
    });

    return {
      user: {
        id: savedUser.id,
        username: savedUser.username,
        createdAt: savedUser.createdAt,
        notificationCategoryPreferences:
          savedUser.notificationCategoryPreferences ?? null,
      },
      token,
      tokenExpiresIn: "7d",
    };
  }

  private normalizeNotificationCategoryPreferences(
    raw: unknown
  ): string[] | null {
    if (raw === null || raw === undefined) {
      return null;
    }
    if (!Array.isArray(raw)) {
      throw new AppError(
        "notificationCategoryPreferences debe ser un array de strings",
        400
      );
    }
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of raw) {
      if (typeof item !== "string") {
        throw new AppError(
          "Cada categoría en notificationCategoryPreferences debe ser texto",
          400
        );
      }
      const s = item.trim().toLowerCase();
      if (s.length === 0) continue;
      if (s.length > 64) {
        throw new AppError("Cada categoría no puede superar 64 caracteres", 400);
      }
      if (!seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
    return out.length > 0 ? out : null;
  }

  private validateInput(username: string, password: string): void {
    if (!username || username.trim().length === 0) {
      throw new AppError("El username es requerido", 400);
    }

    if (username.trim().length < 3) {
      throw new AppError("El username debe tener al menos 3 caracteres", 400);
    }

    if (!password || password.length === 0) {
      throw new AppError("La contraseña es requerida", 400);
    }

    if (password.length < 6) {
      throw new AppError("La contraseña debe tener al menos 6 caracteres", 400);
    }
  }

  private async ensureUsernameNotTaken(username: string): Promise<void> {
    const existing = await this.userRepository.findByUsername(username);
    if (existing) {
      throw new AppError("El username ya está en uso", 409);
    }
  }
}
