import { Meal } from "../Entities/Meal";

export interface MealRepository {
    create(meal: Meal): Promise<Meal>;
    findById(id: string): Promise<Meal | null>;
    /** Todas las comidas (catálogo compartido entre usuarios) */
    findAll(): Promise<Meal[]>;
    /** Todas las comidas de una fecha */
    findByDate(date: Date): Promise<Meal[]>;
    /** Todas las comidas en un rango de fechas */
    findByDateRange(startDate: Date, endDate: Date): Promise<Meal[]>;
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

  async findAll(): Promise<Meal[]> {
    return Array.from(this.meals.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findByDate(date: Date): Promise<Meal[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const result: Meal[] = [];
    for (const meal of this.meals.values()) {
      const mealDate = new Date(meal.date);
      mealDate.setHours(0, 0, 0, 0);
      if (mealDate.getTime() === targetDate.getTime()) result.push(meal);
    }
    return result.sort((a, b) => (a.mealTime.localeCompare(b.mealTime)));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Meal[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const result: Meal[] = [];
    for (const meal of this.meals.values()) {
      const d = new Date(meal.date).getTime();
      if (d >= start.getTime() && d <= end.getTime()) result.push(meal);
    }
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
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