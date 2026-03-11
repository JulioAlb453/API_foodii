"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUserUseCase = void 0;
const crypto_1 = require("crypto");
const User_1 = require("src/Users/Domain/Entities/User");
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class RegisterUserUseCase {
    constructor(userRepository, hashService, tokenService) {
        this.userRepository = userRepository;
        this.hashService = hashService;
        this.tokenService = tokenService;
    }
    async execute(request) {
        const { username, password } = request;
        this.validateInput(username, password);
        const cleanUsername = username.toLowerCase().trim();
        await this.ensureUsernameNotTaken(cleanUsername);
        const hashedPassword = await this.hashService.hash(password);
        const now = new Date();
        const user = User_1.User.create({
            id: (0, crypto_1.randomUUID)(),
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
    validateInput(username, password) {
        if (!username || username.trim().length === 0) {
            throw new AppErrors_1.AppError("El username es requerido", 400);
        }
        if (username.trim().length < 3) {
            throw new AppErrors_1.AppError("El username debe tener al menos 3 caracteres", 400);
        }
        if (!password || password.length === 0) {
            throw new AppErrors_1.AppError("La contraseña es requerida", 400);
        }
        if (password.length < 6) {
            throw new AppErrors_1.AppError("La contraseña debe tener al menos 6 caracteres", 400);
        }
    }
    async ensureUsernameNotTaken(username) {
        const existing = await this.userRepository.findByUsername(username);
        if (existing) {
            throw new AppErrors_1.AppError("El username ya está en uso", 409);
        }
    }
}
exports.RegisterUserUseCase = RegisterUserUseCase;
