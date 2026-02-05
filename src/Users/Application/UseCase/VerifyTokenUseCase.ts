import { TokenService } from "src/Core/Application/Ports/TokenService.interface";
import { UserRepository } from "src/Users/Domain/Interfaces/UserRepository";

interface VerifyTokenRequest {
  token: string;
}

interface VerifyTokenResponse {
  isValid: boolean;
  user?: {
    id: string;
    username: string;
  };
  error?: string;
}

export class VerifyTokenUseCase {
  constructor(
    private tokenService: TokenService,
    private userRepository: UserRepository
  ) {}

  async execute(request: VerifyTokenRequest): Promise<VerifyTokenResponse> {
    const { token } = request;

    try {
      const payload = this.tokenService.verify(token);

      const user = await this.userRepository.findById(payload.id);
      
      if (!user) {
        return {
          isValid: false,
          error: 'Usuario no encontrado'
        };
      }

      return {
        isValid: true,
        user: {
          id: user.id,
          username: user.username
        }
      };

    } catch (error: any) {
      return {
        isValid: false,
        error: error.message || 'Token inválido'
      };
    }
  }
}