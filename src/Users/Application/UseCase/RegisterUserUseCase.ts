import { User } from "src/Users/Domain/Entities/User";
import { UserRepository } from "src/Users/Domain/Interfaces/UserRepository";
import { AppError } from "@shared/Errors/AppErrors";
import { HashService } from "src/Core/UseCase/HashService.interface";

interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export class ChangePasswordUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService,
  ) {}

  async execute(
    request: ChangePasswordRequest,
  ): Promise<ChangePasswordResponse> {
    const { userId, currentPassword, newPassword } = request;

    if (newPassword.length < 6) {
      throw new AppError(
        "La nueva contraseña debe tener al menos 6 caracteres",
        400,
      );
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const isValidPassword = await this.hashService.compare(
      currentPassword,
      user.password,
    );

    if (!isValidPassword) {
      throw new AppError("Contraseña actual incorrecta", 401);
    }

    const isSamePassword = await this.hashService.compare(
      newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new AppError(
        "La nueva contraseña debe ser diferente a la actual",
        400,
      );
    }

    const hashedNewPassword = await this.hashService.hash(newPassword);

    const updatedUser = User.create({
      id: user.id,
      username: user.username,
      password: hashedNewPassword,
      createdAt: user.createdAt,
      updatedAt: new Date(),
    });

    await this.userRepository.create(updatedUser);

    return {
      success: true,
      message: "Contraseña cambiada exitosamente",
    };
  }
}
