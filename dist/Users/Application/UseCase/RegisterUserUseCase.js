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
        const { username, password, notificationCategoryPreferences } = request;
        this.validateInput(username, password);
        const cleanUsername = username.toLowerCase().trim();
        await this.ensureUsernameNotTaken(cleanUsername);
        const prefs = this.normalizeNotificationCategoryPreferences(notificationCategoryPreferences);
        const hashedPassword = await this.hashService.hash(password);
        const now = new Date();
        const user = User_1.User.create({
            id: (0, crypto_1.randomUUID)(),
            username: cleanUsername,
            password: hashedPassword,
            fcmToken: null,
            notificationCategoryPreferences: prefs,
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
                notificationCategoryPreferences: savedUser.notificationCategoryPreferences ?? null,
            },
            token,
            tokenExpiresIn: "7d",
        };
    }
    normalizeNotificationCategoryPreferences(raw) {
        if (raw === null || raw === undefined) {
            return null;
        }
        if (!Array.isArray(raw)) {
            throw new AppErrors_1.AppError("notificationCategoryPreferences debe ser un array de strings", 400);
        }
        const seen = new Set();
        const out = [];
        for (const item of raw) {
            if (typeof item !== "string") {
                throw new AppErrors_1.AppError("Cada categoría en notificationCategoryPreferences debe ser texto", 400);
            }
            const s = item.trim().toLowerCase();
            if (s.length === 0)
                continue;
            if (s.length > 64) {
                throw new AppErrors_1.AppError("Cada categoría no puede superar 64 caracteres", 400);
            }
            if (!seen.has(s)) {
                seen.add(s);
                out.push(s);
            }
        }
        return out.length > 0 ? out : null;
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
