import { IUser } from "../Interfaces/IUser";

export class User implements IUser {
  constructor(
    public id: string,
    public username: string,
    public password: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(data: IUser) {
    return new User(
      data.id,
      data.username,
      data.password,
      data.createdAt,
      data.updatedAt,
    );
  }
}
