import { UserRepository, UserRepositories } from "src/Users/Domain/Interfaces/UserRepository";
import { HashService } from "src/Core/Application/Ports/HashService.interface";
import { TokenService } from "src/Core/Application/Ports/TokenService.interface";
import { BcryptAdapter } from "src/Core/Infraestructure/Adapters/Segurity/Bcrypt.adapter";
import { JwtAdapter } from "src/Core/Infraestructure/Adapters/Segurity/Json.adapter";
import { RegisterUserUseCase } from "src/Users/Application/UseCase/RegisterUserUseCase";
import { LoginUserUseCase } from "src/Users/Application/UseCase/LoginUseCase";
import { GetUserProfileUseCase } from "src/Users/Application/UseCase/GetUserProfileUseCase";
import { UpdateProfileUseCase } from "src/Users/Application/UseCase/UpdateUserUseCase";
import { DeleteAccountUseCase } from "src/Users/Application/UseCase/DeleteAccoutUseCase";
import { VerifyTokenUseCase } from "src/Users/Application/UseCase/VerifyTokenUseCase";
import { AuthController } from "src/Users/infrastructure/Controllers/UsersController";

export interface AuthDependenciesOptions {
  userRepository?: UserRepository;
  hashService?: HashService;
  tokenService?: TokenService;
}

export function createAuthDependencies(options?: AuthDependenciesOptions) {
  const userRepository = options?.userRepository ?? new UserRepositories();
  const hashService = options?.hashService ?? new BcryptAdapter();
  const tokenService = options?.tokenService ?? new JwtAdapter();

  const registerUserUseCase = new RegisterUserUseCase(
    userRepository,
    hashService,
    tokenService
  );
  const loginUserUseCase = new LoginUserUseCase(
    userRepository,
    hashService,
    tokenService
  );
  const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
  const updateProfileUseCase = new UpdateProfileUseCase(userRepository);
  const deleteAccountUseCase = new DeleteAccountUseCase(userRepository);
  const verifyTokenUseCase = new VerifyTokenUseCase(
    tokenService,
    userRepository
  );

  const authController = new AuthController(
    registerUserUseCase,
    loginUserUseCase,
    getUserProfileUseCase,
    updateProfileUseCase,
    deleteAccountUseCase,
    verifyTokenUseCase
  );

  return {
    authController,
    tokenService,
    userRepository,
  };
}
