import { Meal } from "../Entities/Meal";

export interface MealRepository {
    create(meal: Meal): Promise<Meal>;
    findById(id: string): Promise<Meal | null>;
    findByUserAndDate(userId: string, date: Date): Promise<Meal[]>;
    findByUser(userId: string): Promise<Meal[]>;
    update(meal: Meal): Promise<Meal>;
    delete(id: string): Promise<void>;
}