import { AppError } from "src/shared/Errors/AppErrors";
import { UserRepository } from 'src/Users/Domain/Interfaces/UserRepository';

interface GetUserProfileRequest {
  userId: string;
}

interface GetUserProfileResponse {
  id: string;
  username: string;
  createdAt: Date;
  accountInfo?: {
    daysSinceCreation: number;
    isRecentAccount: boolean;
  };
}

export class GetUserProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    const { userId } = request;

    // 1. Validar entrada
    this.validateInput(userId);

    // 2. Buscar usuario
    const user = await this.findUser(userId);

    // 3. Preparar respuesta
    return this.buildResponse(user);
  }

  private validateInput(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new AppError('ID de usuario es requerido', 400);
    }

    // Validar formato UUID si es necesario
    if (!this.isValidIdFormat(userId)) {
      throw new AppError('Formato de ID inválido', 400);
    }
  }

  private isValidIdFormat(id: string): boolean {
    // Si usas UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Si usas otros formatos, ajusta la validación
    // Por ahora, aceptamos cualquier string no vacío
    return id.trim().length > 0;
  }

  private async findUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return user;
  }

  private buildResponse(user: any): GetUserProfileResponse {
    const daysSinceCreation = this.calculateDaysSinceCreation(user.createdAt);
    
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      accountInfo: {
        daysSinceCreation,
        isRecentAccount: daysSinceCreation < 30 // Menos de 30 días
      }
    };
  }

  private calculateDaysSinceCreation(createdAt: Date): number {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convertir a días
  }
}