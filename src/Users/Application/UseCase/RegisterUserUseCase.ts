import { randomUUID } from "crypto";
import { User } from "src/Users/Domain/Entities/User";
import { UserRepository } from "src/Users/Domain/Interfaces/UserRepository";
import { AppError } from "@shared/Errors/AppErrors";
import { HashService } from "src/Core/Application/Ports/HashService.interface";
import { TokenService } from "src/Core/Application/Ports/TokenService.interface";

export interface RegisterUserRequest {
  username: string;
  password: string;
}

export interface RegisterUserResponse {
  user: {
    id: string;
    username: string;
    createdAt: Date;
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
    const { username, password } = request;

    this.validateInput(username, password);

    const cleanUsername = username.toLowerCase().trim();

    await this.ensureUsernameNotTaken(cleanUsername);

    const hashedPassword = await this.hashService.hash(password);
    const now = new Date();

    const user = User.create({
      id: randomUUID(),
      username: cleanUsername,
      password: hashedPassword,
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
      },
      token,
      tokenExpiresIn: "7d",
    };
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
