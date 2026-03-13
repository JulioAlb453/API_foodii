import { v4 as uuidv4 } from "uuid";

export class Dish {
  public id: string;
  public name: string;
  public description: string | null;
  public calories: number;
  public image: string | null;
  public createdBy: string;
  public createdAt: Date;

  private constructor(
    id: string,
    name: string,
    description: string | null,
    calories: number,
    image: string | null,
    createdBy: string,
    createdAt: Date
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.calories = calories;
    this.image = image;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
  }

  static create(props: {
    id?: string;
    name: string;
    description?: string | null;
    calories: number;
    image?: string | null;
    createdBy: string;
    createdAt?: Date;
  }): Dish {
    return new Dish(
      props.id ?? uuidv4(),
      props.name,
      props.description ?? null,
      props.calories,
      props.image ?? null,
      props.createdBy,
      props.createdAt ?? new Date()
    );
  }
}
