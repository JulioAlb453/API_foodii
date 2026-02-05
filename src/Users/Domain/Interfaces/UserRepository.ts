import { User } from "../Entities/User";

export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
}

export class UserRepositories implements UserRepository {
  private users: Map<string, User> = new Map();

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const normalizedUsername = username.toLowerCase().trim();

    for (const user of this.users.values()) {
      if (user.username === normalizedUsername) {
        return user;
      }
    }

    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
}
