"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserProfileUseCase = void 0;
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class GetUserProfileUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(request) {
        const { userId } = request;
        // 1. Validar entrada
        this.validateInput(userId);
        // 2. Buscar usuario
        const user = await this.findUser(userId);
        // 3. Preparar respuesta
        return this.buildResponse(user);
    }
    validateInput(userId) {
        if (!userId || userId.trim().length === 0) {
            throw new AppErrors_1.AppError('ID de usuario es requerido', 400);
        }
        // Validar formato UUID si es necesario
        if (!this.isValidIdFormat(userId)) {
            throw new AppErrors_1.AppError('Formato de ID inválido', 400);
        }
    }
    isValidIdFormat(id) {
        // Si usas UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        // Si usas otros formatos, ajusta la validación
        // Por ahora, aceptamos cualquier string no vacío
        return id.trim().length > 0;
    }
    async findUser(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppErrors_1.AppError('Usuario no encontrado', 404);
        }
        return user;
    }
    buildResponse(user) {
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
    calculateDaysSinceCreation(createdAt) {
        const now = new Date();
        const created = new Date(createdAt);
        const diffTime = Math.abs(now.getTime() - created.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convertir a días
    }
}
exports.GetUserProfileUseCase = GetUserProfileUseCase;
