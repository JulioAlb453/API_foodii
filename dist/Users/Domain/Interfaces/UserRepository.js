"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepositories = void 0;
class UserRepositories {
    constructor() {
        this.users = new Map();
    }
    async create(user) {
        this.users.set(user.id, user);
        return user;
    }
    async findByUsername(username) {
        const normalizedUsername = username.toLowerCase().trim();
        for (const user of this.users.values()) {
            if (user.username === normalizedUsername) {
                return user;
            }
        }
        return null;
    }
    async findById(id) {
        return this.users.get(id) || null;
    }
}
exports.UserRepositories = UserRepositories;
