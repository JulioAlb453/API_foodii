import { Ingredients } from "../Entities/Ingredients";

export interface IngredientsReposotory {
    create(ingredients: Ingredients): Promise<Ingredients>;
    findById(id: string): Promise<Ingredients | null>;
    findByUser(userId: string): Promise<Ingredients[]>;
    update(ingredients: Ingredients): Promise<Ingredients>;
    delete(id: string): Promise<void>;
}