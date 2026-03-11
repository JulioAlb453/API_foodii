"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAdapter = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JwtAdapter {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'SECRET_KEY';
    }
    generate(payload) {
        return jsonwebtoken_1.default.sign(payload, this.secret, { expiresIn: '7d' });
    }
    verify(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.secret);
        }
        catch (error) {
            throw new Error('Token inválido o expirado');
        }
    }
}
exports.JwtAdapter = JwtAdapter;
