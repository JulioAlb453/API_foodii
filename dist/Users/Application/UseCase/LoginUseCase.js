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
    validateInput(username, password) {
        if (!username || username.trim().length === 0) {
            throw new AppErrors_1.AppError('El username es requerido', 400);
        }
        if (!password || password.length === 0) {
            throw new AppErrors_1.AppError('La contraseña es requerida', 400);
        }
        if (password.length < 6) {
            throw new AppErrors_1.AppError('La contraseña debe tener al menos 6 caracteres', 400);
        }
    }
    cleanUsername(username) {
        return username.toLowerCase().trim();
    }
    async findUser(username) {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            // No revelar si el usuario existe o no (seguridad)
            throw new AppErrors_1.AppError('Credenciales incorrectas', 401);
        }
        return user;
    }
    async verifyPassword(inputPassword, storedHash) {
        const isValid = await this.hashService.compare(inputPassword, storedHash);
        if (!isValid) {
            throw new AppErrors_1.AppError('Credenciales incorrectas', 401);
        }
    }
    generateToken(user) {
        try {
            return this.tokenService.generate({
                id: user.id,
                username: user.username
            });
        }
        catch (error) {
            throw new AppErrors_1.AppError('Error al generar token de autenticación', 500);
        }
    }
    buildResponse(user, token) {
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
exports.LoginUserUseCase = LoginUserUseCase;
