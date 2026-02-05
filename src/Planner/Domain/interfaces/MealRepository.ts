import { Meal } from "../Entities/Meal";

export interface MealRepository {
    create(meal: Meal): Promise<Meal>;
    findById(id: string): Promise<Meal | null>;
    findByUserAndDate(userId: string, date: Date): Promise<Meal[]>;
    findByUser(userId: string): Promise<Meal[]>;
    delete(id: string, userId: string): Promise<boolean>;
}

export class MealRepositories implements MealRepository{
    private meals: Map<string, Meal> = new Map();

   async create(meal: Meal): Promise<Meal> {
    this.meals.set(meal.id, meal);
    return meal;
  }

  async findById(id: string): Promise<Meal | null> {
    return this.meals.get(id) || null;
  }

  async findByUserAndDate(userId: string, date: Date): Promise<Meal[]> {
    const userMeals: Meal[] = [];
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    for (const meal of this.meals.values()) {
      const mealDate = new Date(meal.date);
      mealDate.setHours(0, 0, 0, 0);
      
      if (meal.CreatedBy === userId && mealDate.getTime() === targetDate.getTime()) {
        userMeals.push(meal);
      }
    }
    
    return userMeals;
  }

  async findByUser(userId: string): Promise<Meal[]> {
    const userMeals: Meal[] = [];
    
    for (const meal of this.meals.values()) {
      if (meal.CreatedBy === userId) {
        userMeals.push(meal);
      }
    }
    
    return userMeals.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const meal = await this.findById(id);
    
    if (meal && meal.CreatedBy === userId) {
      return this.meals.delete(id);
    }
    
    return false;
  }
}