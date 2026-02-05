import { User } from "src/Users/Domain/Entities/User";
import { UserRepository } from "src/Users/Domain/Interfaces/UserRepository";
import { AppError } from "@shared/Errors/AppErrors";

interface UpdateProfileRequest {
  userId: string;
  username?: string;
}

interface UpdateProfileResponse {
  id: string;
  username: string;
  createdAt: Date;
}

export class UpdateProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const { userId, username } = request;

    if (!username) {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new AppError("Usuario no encontrado", 404);
      }

      return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      };
    }

    const normalizedUsername = username.toLowerCase().trim();

    if (normalizedUsername.length < 3) {
      throw new AppError(
        "El nombre de usuario debe tener al menos 3 caracteres",
        400,
      );
    }

    const currentUser = await this.userRepository.findById(userId);

    if (!currentUser) {
      throw new AppError("Usuario no encontrado", 404);
    }

    if (normalizedUsername !== currentUser.username) {
      const existingUser =
        await this.userRepository.findByUsername(normalizedUsername);

      if (existingUser) {
        throw new AppError("El nombre de usuario ya está en uso", 409);
      }
    }

    const updatedUser = User.create({
      id: currentUser.id,
      username: normalizedUsername,
      password: currentUser.password,
      createdAt: currentUser.createdAt,
      updatedAt: new Date(),
    });

    await this.userRepository.create(updatedUser);

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      createdAt: updatedUser.createdAt,
    };
  }
}
