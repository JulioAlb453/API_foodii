"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BcryptAdapter = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
class BcryptAdapter {
    async hash(password) {
        const salt = await bcrypt_1.default.genSalt(10);
        return bcrypt_1.default.hash(password, salt);
    }
    async compare(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
}
exports.BcryptAdapter = BcryptAdapter;
