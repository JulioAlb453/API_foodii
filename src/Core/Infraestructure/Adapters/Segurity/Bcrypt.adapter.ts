import bycrypt from "bcrypt";
import { HashService } from "src/Core/Application/Ports/HashService.interface";

export class BcryptAdapter implements HashService {
  async hash(password: string): Promise<string> {
    const salt = await bycrypt.genSalt(10);
    return bycrypt.hash(password, salt);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bycrypt.compare(password, hash);
  }
}