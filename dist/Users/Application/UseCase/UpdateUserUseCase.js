"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileUseCase = void 0;
const User_1 = require("src/Users/Domain/Entities/User");
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class UpdateProfileUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(request) {
        const { userId, username } = request;
        if (!username) {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new AppErrors_1.AppError("Usuario no encontrado", 404);
            }
            return {
                id: user.id,
                username: user.username,
                createdAt: user.createdAt,
            };
        }
        const normalizedUsername = username.toLowerCase().trim();
        if (normalizedUsername.length < 3) {
            throw new AppErrors_1.AppError("El nombre de usuario debe tener al menos 3 caracteres", 400);
        }
        const currentUser = await this.userRepository.findById(userId);
        if (!currentUser) {
            throw new AppErrors_1.AppError("Usuario no encontrado", 404);
        }
        if (normalizedUsername !== currentUser.username) {
            const existingUser = await this.userRepository.findByUsername(normalizedUsername);
            if (existingUser) {
                throw new AppErrors_1.AppError("El nombre de usuario ya está en uso", 409);
            }
        }
        const updatedUser = User_1.User.create({
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
exports.UpdateProfileUseCase = UpdateProfileUseCase;
