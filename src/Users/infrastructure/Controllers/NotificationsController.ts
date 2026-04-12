import { Request, Response } from "express";
import { FcmPushPort } from "src/Core/Application/Ports/FcmPushPort.interface";
import { AppError } from "src/shared/Errors/AppErrors";

/**
 * Endpoints operativos para disparar notificaciones (p. ej. cuando el admin publica una receta).
 * Protegidos con `X-Admin-Secret` = variable de entorno `ADMIN_PUSH_SECRET`.
 */
export class NotificationsController {
  constructor(private readonly fcm: FcmPushPort) {}

  async sendTopicNotification(req: Request, res: Response): Promise<void> {
    try {
      const expected = process.env.ADMIN_PUSH_SECRET?.trim();
      if (!expected) {
        res.status(503).json({
          success: false,
          error:
            "Envío administrativo deshabilitado: define ADMIN_PUSH_SECRET en el servidor",
        });
        return;
      }

      const header = req.headers["x-admin-secret"];
      const provided =
        typeof header === "string"
          ? header
          : Array.isArray(header)
            ? header[0]
            : "";

      if (provided !== expected) {
        res.status(401).json({ success: false, error: "No autorizado" });
        return;
      }

      const { topicSlug, title, body, data } = req.body ?? {};

      if (!topicSlug || typeof topicSlug !== "string") {
        res.status(400).json({
          success: false,
          error: "Body requiere topicSlug (string)",
        });
        return;
      }
      if (!title || typeof title !== "string") {
        res.status(400).json({
          success: false,
          error: "Body requiere title (string)",
        });
        return;
      }
      if (!body || typeof body !== "string") {
        res.status(400).json({
          success: false,
          error: "Body requiere body (string)",
        });
        return;
      }

      let dataPayload: Record<string, string> | undefined;
      if (data != null) {
        if (typeof data !== "object" || Array.isArray(data)) {
          res.status(400).json({
            success: false,
            error: "data debe ser un objeto con valores string (ej. { \"mealId\": \"...\" })",
          });
          return;
        }
        dataPayload = {};
        for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
          if (v == null) continue;
          dataPayload[k] = String(v);
        }
      }

      const messageId = await this.fcm.sendToTopic({
        topicSlug,
        title,
        body,
        data: dataPayload,
      });

      res.status(200).json({
        success: true,
        message: "Notificación enviada al tópico",
        data: { messageId, topicSlug },
      });
    } catch (error: any) {
      const statusCode =
        error instanceof AppError ? error.statusCode : error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message ?? "Error al enviar notificación",
      });
    }
  }
}
