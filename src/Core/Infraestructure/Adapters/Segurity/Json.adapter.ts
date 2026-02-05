import jwt from "jsonwebtoken";
import { TokenService, TokenPayload } from "src/Core/Application/Ports/TokenService.interface";

export class JwtAdapter implements TokenService {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'SECRET_KEY';
  }

  generate(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: '7d' });
  }

  verify(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.secret) as TokenPayload;
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }
}