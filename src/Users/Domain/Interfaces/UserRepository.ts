import { User } from "../Entities/User";

export interface UserRepository {
    create(user: User): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    update(user: User): Promise<User>;
    delete(id: string): Promise<void>;
}