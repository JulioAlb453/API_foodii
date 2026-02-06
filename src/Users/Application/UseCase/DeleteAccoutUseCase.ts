import { UserRepository } from "src/Users/Domain/Interfaces/UserRepository";
import { AppError } from "src/shared/Errors/AppErrors";


interface DeleteAccountRequest {
  userId: string;
  password: string;
}

interface DeleteAccountResponse {
  success: boolean;
  message: string;
}

export class DeleteAccountUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: DeleteAccountRequest): Promise<DeleteAccountResponse> {
    const { userId, password } = request;

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    //TODO: implementar hashService  y eliminacion del usuario

    return {
      success: true,
      message: "Cuenta eliminada exitosamente",
    };
  }
}
