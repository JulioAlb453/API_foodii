"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteAccountUseCase = void 0;
const AppErrors_1 = require("src/shared/Errors/AppErrors");
class DeleteAccountUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(request) {
        const { userId, password } = request;
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppErrors_1.AppError("Usuario no encontrado", 404);
        }
        //TODO: implementar hashService  y eliminacion del usuario
        return {
            success: true,
            message: "Cuenta eliminada exitosamente",
        };
    }
}
exports.DeleteAccountUseCase = DeleteAccountUseCase;
