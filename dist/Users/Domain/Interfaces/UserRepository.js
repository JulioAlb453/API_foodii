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
    async assignFcmTokenExclusive(userId, fcmToken) {
        for (const u of this.users.values()) {
            if (u.id !== userId && u.fcmToken === fcmToken) {
                u.fcmToken = null;
            }
        }
        const user = this.users.get(userId);
        if (user) {
            user.fcmToken = fcmToken;
        }
    }
    async updateNotificationPreferences(userId, categorySlugs, fcmToken) {
        const user = this.users.get(userId);
        if (!user)
            return;
        user.notificationCategoryPreferences = categorySlugs;
        user.updatedAt = new Date();
        if (fcmToken !== undefined) {
            if (fcmToken === null) {
                user.fcmToken = null;
            }
            else {
                await this.assignFcmTokenExclusive(userId, fcmToken);
            }
        }
    }
}
exports.UserRepositories = UserRepositories;
