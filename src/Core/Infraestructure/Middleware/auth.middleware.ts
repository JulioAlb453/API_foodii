import { Request, Response, NextFunction } from "express";
import { TokenService } from "src/Core/Application/Ports/TokenService.interface";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

export function createAuthMiddleware(tokenService: TokenService) {
  return function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Token de autenticación requerido",
      });
      return;
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Token inválido",
      });
      return;
    }

    try {
      const payload = tokenService.verify(token);
      req.user = {
        id: payload.id,
        username: payload.username,
      };
      next();
    } catch {
      res.status(401).json({
        success: false,
        error: "Token inválido o expirado",
      });
    }
  };
}
