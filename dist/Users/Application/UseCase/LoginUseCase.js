"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUserUseCase = void 0;
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class LoginUserUseCase {
    constructor(userRepository, hashService, tokenService) {
        this.userRepository = userRepository;
        this.hashService = hashService;
        this.tokenService = tokenService;
    }
    async execute(request) {
        const { username, password, fcmToken } = request;
        this.validateInput(username, password);
        const cleanUsername = this.cleanUsername(username);
        const user = await this.findUser(cleanUsername);
        await this.verifyPassword(password, user.password);
        const token = this.generateToken(user);
        await this.persistFcmTokenIfPresent(user.id, fcmToken);
        return this.buildResponse(user, token);
    }
    /**
     * Si viene un token FCM no vacío, lo guarda para este usuario y lo quita de otros.
     * Si es null/undefined/vacío, no hace nada (no rompe el login).
     * Si falla la BD, el login sigue siendo exitoso (solo se registra en consola).
     */
    async persistFcmTokenIfPresent(userId, fcmToken) {
        if (fcmToken === null || fcmToken === undefined) {
            return;
        }
        const trimmed = typeof fcmToken === "string" ? fcmToken.trim() : "";
        if (trimmed.length === 0) {
            return;
        }
        try {
            await this.userRepository.assignFcmTokenExclusive(userId, trimmed);
        }
        catch (err) {
            console.error("[LoginUserUseCase] No se pudo guardar fcmToken:", err);
        }
    }
    validateInput(username, password) {
        if (!username || username.trim().length === 0) {
            throw new AppErrors_1.AppError("El username es requerido", 400);
        }
        if (!password || password.length === 0) {
            throw new AppErrors_1.AppError("La contraseña es requerida", 400);
        }
        if (password.length < 6) {
            throw new AppErrors_1.AppError("La contraseña debe tener al menos 6 caracteres", 400);
        }
    }
    cleanUsername(username) {
        return username.toLowerCase().trim();
    }
    async findUser(username) {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new AppErrors_1.AppError("Credenciales incorrectas", 401);
        }
        return user;
    }
    async verifyPassword(inputPassword, storedHash) {
        const isValid = await this.hashService.compare(inputPassword, storedHash);
        if (!isValid) {
            throw new AppErrors_1.AppError("Credenciales incorrectas", 401);
        }
    }
    generateToken(user) {
        try {
            return this.tokenService.generate({
                id: user.id,
                username: user.username,
            });
        }
        catch {
            throw new AppErrors_1.AppError("Error al generar token de autenticación", 500);
        }
    }
    buildResponse(user, token) {
        return {
            user: {
                id: user.id,
                username: user.username,
                createdAt: user.createdAt,
            },
            token,
            tokenExpiresIn: "7d",
        };
    }
}
exports.LoginUserUseCase = LoginUserUseCase;
