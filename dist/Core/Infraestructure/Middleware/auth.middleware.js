"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = createAuthMiddleware;
function createAuthMiddleware(tokenService) {
    return function authMiddleware(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                error: "Token de autenticación requerido",
            });
            return;
        }
        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) {
            res.status(401).json({
                success: false,
                error: "Token inválido",
            });
            return;
        }
        try {
            const payload = tokenService.verify(token);
            req.user = {
                id: payload.id,
                username: payload.username,
            };
            next();
        }
        catch {
            res.status(401).json({
                success: false,
                error: "Token inválido o expirado",
            });
        }
    };
}
