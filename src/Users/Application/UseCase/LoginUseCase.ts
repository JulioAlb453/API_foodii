import { AppError } from "src/shared/Errors/AppErrors";
import { TokenService } from 'src/Core/Application/Ports/TokenService.interface';
import { HashService } from 'src/Core/Application/Ports/HashService.interface';
import { UserRepository } from 'src/Users/Domain/Interfaces/UserRepository';

interface LoginUserRequest {
  username: string;
  password: string;
}

interface LoginUserResponse {
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

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    const { username, password } = request;

    // 1. Validaciones de entrada
    this.validateInput(username, password);

    // 2. Normalizar y limpiar datos
    const cleanUsername = this.cleanUsername(username);

    // 3. Buscar usuario
    const user = await this.findUser(cleanUsername);

    // 4. Verificar contraseña
    await this.verifyPassword(password, user.password);

    // 5. Generar token
    const token = this.generateToken(user);

    // 6. Retornar respuesta
    return this.buildResponse(user, token);
  }

  private validateInput(username: string, password: string): void {
    if (!username || username.trim().length === 0) {
      throw new AppError('El username es requerido', 400);
    }

    if (!password || password.length === 0) {
      throw new AppError('La contraseña es requerida', 400);
    }

    if (password.length < 6) {
      throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
    }
  }

  private cleanUsername(username: string): string {
    return username.toLowerCase().trim();
  }

  private async findUser(username: string) {
    const user = await this.userRepository.findByUsername(username);
    
    if (!user) {
      // No revelar si el usuario existe o no (seguridad)
      throw new AppError('Credenciales incorrectas', 401);
    }

    return user;
  }

  private async verifyPassword(inputPassword: string, storedHash: string): Promise<void> {
    const isValid = await this.hashService.compare(inputPassword, storedHash);
    
    if (!isValid) {
      throw new AppError('Credenciales incorrectas', 401);
    }
  }

  private generateToken(user: any): string {
    try {
      return this.tokenService.generate({
        id: user.id,
        username: user.username
      });
    } catch (error) {
      throw new AppError('Error al generar token de autenticación', 500);
    }
  }

  private buildResponse(user: any, token: string): LoginUserResponse {
    return {
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      },
      token,
      tokenExpiresIn: '7d' // Esto debería venir del TokenService
    };
  }
}