import { Request, Response } from 'express';
import { RegisterUserUseCase } from 'src/Users/Application/UseCase/RegisterUserUseCase';
import { GetUserProfileUseCase } from 'src/Users/Application/UseCase/GetUserProfileUseCase';
import { UpdateProfileUseCase } from 'src/Users/Application/UseCase/UpdateUserUseCase';
import { DeleteAccountUseCase } from 'src/Users/Application/UseCase/DeleteAccoutUseCase';
import { VerifyTokenUseCase } from 'src/Users/Application/UseCase/VerifyTokenUseCase';
import { LoginUserUseCase } from 'src/Users/Application/UseCase/LoginUseCase';
import { UpdateNotificationPreferencesUseCase } from 'src/Users/Application/UseCase/UpdateNotificationPreferencesUseCase';

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private getUserProfileUseCase: GetUserProfileUseCase,
    private updateProfileUseCase: UpdateProfileUseCase,
    private deleteAccountUseCase: DeleteAccountUseCase,
    private verifyTokenUseCase: VerifyTokenUseCase,
    private updateNotificationPreferencesUseCase: UpdateNotificationPreferencesUseCase
  ) {}


  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, notificationCategoryPreferences } = req.body;

      if (!username || !password) {
        res.status(400).json({
          success: false,
          error: 'Username y password son requeridos'
        });
        return;
      }

      if (username.trim().length < 3) {
        res.status(400).json({
          success: false,
          error: 'El username debe tener al menos 3 caracteres'
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres'
        });
        return;
      }

      const result = await this.registerUserUseCase.execute({
        username,
        password,
        notificationCategoryPreferences:
          notificationCategoryPreferences === null ||
          notificationCategoryPreferences === undefined
            ? undefined
            : notificationCategoryPreferences,
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Iniciar sesión
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, fcmToken } = req.body;

      // Validaciones básicas
      if (!username || !password) {
        res.status(400).json({
          success: false,
          error: 'Username y password son requeridos'
        });
        return;
      }

      const result = await this.loginUserUseCase.execute({
        username,
        password,
        fcmToken: fcmToken === null || fcmToken === undefined ? undefined : fcmToken,
      });

      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: result
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      
      const result = await this.getUserProfileUseCase.execute({
        userId
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Actualizar perfil (solo username por ahora)
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { username } = req.body;

      // Si no hay datos para actualizar
      if (!username) {
        res.status(400).json({
          success: false,
          error: 'No hay datos para actualizar'
        });
        return;
      }

      // Validar longitud mínima
      if (username.trim().length < 3) {
        res.status(400).json({
          success: false,
          error: 'El username debe tener al menos 3 caracteres'
        });
        return;
      }

      const result = await this.updateProfileUseCase.execute({
        userId,
        username
      });

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: result
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Verificar token (endpoint protegido)
   */
  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      
      // Verificar que el usuario aún existe
      const result = await this.getUserProfileUseCase.execute({
        userId
      });

      res.status(200).json({
        success: true,
        message: 'Token válido',
        data: {
          id: result.id,
          username: result.username,
          isValid: true
        }
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }
  }

  /**
   * Verificar token desde body (para frontend)
   */
  async verifyTokenFromBody(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Token es requerido'
        });
        return;
      }

      const result = await this.verifyTokenUseCase.execute({
        token
      });

      if (result.isValid) {
        res.status(200).json({
          success: true,
          message: 'Token válido',
          data: result
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error || 'Token inválido'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al verificar token'
      });
    }
  }

  /**
   * Eliminar cuenta de usuario
   */
  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { password } = req.body;

      // Validaciones
      if (!password) {
        res.status(400).json({
          success: false,
          error: 'Password es requerido para eliminar la cuenta'
        });
        return;
      }

      try {
        const profile = await this.getUserProfileUseCase.execute({ userId });
        
        await this.loginUserUseCase.execute({
          username: profile.username,
          password,
        });
      } catch (error) {
        res.status(401).json({
          success: false,
          error: 'Contraseña incorrecta'
        });
        return;
      }

      const result = await this.deleteAccountUseCase.execute({
        userId,
        password 
      });

      res.status(200).json({
        success: true,
        message: 'Cuenta eliminada exitosamente',
        data: result
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }


  async logout(req: Request, res: Response): Promise<void> {
    try {

      
      res.status(200).json({
        success: true,
        message: 'Logout exitoso',
        data: {
          logout: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al hacer logout'
      });
    }
  }


  async authHealth(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Auth service is healthy',
        data: {
          service: 'authentication',
          status: 'operational',
          timestamp: new Date().toISOString(),
          endpoints: [
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/auth/profile',
            'PUT /api/auth/profile',
            'PATCH /api/users/preferences',
            'GET /api/auth/verify-token',
            'POST /api/auth/verify-token',
            'DELETE /api/auth/account',
            'POST /api/auth/logout'
          ]
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Auth service health check failed'
      });
    }
  }

  /**
   * Preferencias de notificación (categorías → slugs en BD) y opcionalmente FCM token.
   * El usuario se identifica por JWT; no uses userId del body en producción.
   */
  async patchNotificationPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { notificationCategoryPreferences, fcmToken } = req.body ?? {};

      if (
        notificationCategoryPreferences !== null &&
        !Array.isArray(notificationCategoryPreferences)
      ) {
        res.status(400).json({
          success: false,
          error:
            'notificationCategoryPreferences debe ser un array de strings o null',
        });
        return;
      }

      const hasFcmKey = Object.prototype.hasOwnProperty.call(req.body ?? {}, "fcmToken");

      const result = await this.updateNotificationPreferencesUseCase.execute({
        userId,
        notificationCategoryPreferences,
        fcmToken: hasFcmKey ? fcmToken : undefined,
      });

      res.status(200).json({
        success: true,
        message: "Preferencias de notificación actualizadas",
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }
}