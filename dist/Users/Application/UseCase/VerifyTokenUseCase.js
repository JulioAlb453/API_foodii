"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyTokenUseCase = void 0;
class VerifyTokenUseCase {
    constructor(tokenService, userRepository) {
        this.tokenService = tokenService;
        this.userRepository = userRepository;
    }
    async execute(request) {
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
        }
        catch (error) {
            return {
                isValid: false,
                error: error.message || 'Token inválido'
            };
        }
    }
}
exports.VerifyTokenUseCase = VerifyTokenUseCase;
