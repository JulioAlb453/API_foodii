"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthDependencies = createAuthDependencies;
const UserRepository_1 = require("src/Users/Domain/Interfaces/UserRepository");
const Bcrypt_adapter_1 = require("src/Core/Infraestructure/Adapters/Segurity/Bcrypt.adapter");
const Json_adapter_1 = require("src/Core/Infraestructure/Adapters/Segurity/Json.adapter");
const RegisterUserUseCase_1 = require("src/Users/Application/UseCase/RegisterUserUseCase");
const LoginUseCase_1 = require("src/Users/Application/UseCase/LoginUseCase");
const GetUserProfileUseCase_1 = require("src/Users/Application/UseCase/GetUserProfileUseCase");
const UpdateUserUseCase_1 = require("src/Users/Application/UseCase/UpdateUserUseCase");
const DeleteAccoutUseCase_1 = require("src/Users/Application/UseCase/DeleteAccoutUseCase");
const VerifyTokenUseCase_1 = require("src/Users/Application/UseCase/VerifyTokenUseCase");
const UsersController_1 = require("src/Users/infrastructure/Controllers/UsersController");
function createAuthDependencies(options) {
    const userRepository = options?.userRepository ?? new UserRepository_1.UserRepositories();
    const hashService = options?.hashService ?? new Bcrypt_adapter_1.BcryptAdapter();
    const tokenService = options?.tokenService ?? new Json_adapter_1.JwtAdapter();
    const registerUserUseCase = new RegisterUserUseCase_1.RegisterUserUseCase(userRepository, hashService, tokenService);
    const loginUserUseCase = new LoginUseCase_1.LoginUserUseCase(userRepository, hashService, tokenService);
    const getUserProfileUseCase = new GetUserProfileUseCase_1.GetUserProfileUseCase(userRepository);
    const updateProfileUseCase = new UpdateUserUseCase_1.UpdateProfileUseCase(userRepository);
    const deleteAccountUseCase = new DeleteAccoutUseCase_1.DeleteAccountUseCase(userRepository);
    const verifyTokenUseCase = new VerifyTokenUseCase_1.VerifyTokenUseCase(tokenService, userRepository);
    const authController = new UsersController_1.AuthController(registerUserUseCase, loginUserUseCase, getUserProfileUseCase, updateProfileUseCase, deleteAccountUseCase, verifyTokenUseCase);
    return {
        authController,
        tokenService,
        userRepository,
    };
}
