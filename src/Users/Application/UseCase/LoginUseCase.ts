import { AppError } from "src/shared/Errors/AppErrors";
import { TokenService } from "src/Core/Application/Ports/TokenService.interface";
import { HashService } from "src/Core/Application/Ports/HashService.interface";
import { UserRepository } from "src/Users/Domain/Interfaces/UserRepository";
import type { LoginRequest } from "../DTOs/login-request.dto";

export interface LoginUserResponse {
  user: {
    id: string;
    username: string;
    createdAt: Date;
  };
  token: string;
  tokenExpiresIn: string;
}

export class LoginUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService,
    private tokenService: TokenService
  ) {}

  async execute(request: LoginRequest): Promise<LoginUserResponse> {
    const { username, password, fcmToken } = request;

    this.validateInput(username, password);

    const cleanUsername = this.cleanUsername(username);

    const user = await this.findUser(cleanUsername);

    await this.verifyPassword(password, user.password);

    const token = this.generateToken(user);

    await this.persistFcmTokenIfPresent(user.id, fcmToken);

    return this.buildResponse(user, token);
  }

  /**
   * Si viene un token FCM no vacío, lo guarda para este usuario y lo quita de otros.
   * Si es null/undefined/vacío, no hace nada (no rompe el login).
   * Si falla la BD, el login sigue siendo exitoso (solo se registra en consola).
   */
  private async persistFcmTokenIfPresent(
    userId: string,
    fcmToken: string | null | undefined
  ): Promise<void> {
    if (fcmToken === null || fcmToken === undefined) {
      return;
    }
    const trimmed = typeof fcmToken === "string" ? fcmToken.trim() : "";
    if (trimmed.length === 0) {
      return;
    }
    try {
      await this.userRepository.assignFcmTokenExclusive(userId, trimmed);
    } catch (err) {
      console.error("[LoginUserUseCase] No se pudo guardar fcmToken:", err);
    }
  }

  private validateInput(username: string, password: string): void {
    if (!username || username.trim().length === 0) {
      throw new AppError("El username es requerido", 400);
    }

    if (!password || password.length === 0) {
      throw new AppError("La contraseña es requerida", 400);
    }

    if (password.length < 6) {
      throw new AppError("La contraseña debe tener al menos 6 caracteres", 400);
    }
  }

  private cleanUsername(username: string): string {
    return username.toLowerCase().trim();
  }

  private async findUser(username: string) {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      throw new AppError("Credenciales incorrectas", 401);
    }

    return user;
  }

  private async verifyPassword(
    inputPassword: string,
    storedHash: string
  ): Promise<void> {
    const isValid = await this.hashService.compare(inputPassword, storedHash);

    if (!isValid) {
      throw new AppError("Credenciales incorrectas", 401);
    }
  }

  private generateToken(user: { id: string; username: string }): string {
    try {
      return this.tokenService.generate({
        id: user.id,
        username: user.username,
      });
    } catch {
      throw new AppError("Error al generar token de autenticación", 500);
    }
  }

  private buildResponse(user: { id: string; username: string; createdAt: Date }, token: string): LoginUserResponse {
    return {
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
      token,
      tokenExpiresIn: "7d",
    };
  }
}
