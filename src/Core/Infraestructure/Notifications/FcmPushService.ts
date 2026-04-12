import * as admin from "firebase-admin";
import {
  FcmPushPort,
  SendToTopicParams,
} from "src/Core/Application/Ports/FcmPushPort.interface";
import { AppError } from "src/shared/Errors/AppErrors";

function tryInitializeFirebase(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      const cred = JSON.parse(json) as admin.ServiceAccount;
      return admin.initializeApp({
        credential: admin.credential.cert(cred),
      });
    } catch (e) {
      console.error(
        "[FCM] FIREBASE_SERVICE_ACCOUNT_JSON no es un JSON válido:",
        e
      );
      return null;
    }
  }

  const file = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (file) {
    try {
      return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (e) {
      console.error(
        "[FCM] No se pudo inicializar con GOOGLE_APPLICATION_CREDENTIALS:",
        e
      );
      return null;
    }
  }

  return null;
}

/**
 * Envío de mensajes FCM a un tópico usando Firebase Admin SDK.
 * Requiere `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON del service account en una línea)
 * o `GOOGLE_APPLICATION_CREDENTIALS` (ruta al archivo JSON).
 */
export class FirebaseAdminFcmPushService implements FcmPushPort {
  private app: admin.app.App | null;

  constructor() {
    this.app = tryInitializeFirebase();
    if (!this.app) {
      console.warn(
        "[FCM] Sin credenciales: define FIREBASE_SERVICE_ACCOUNT_JSON o GOOGLE_APPLICATION_CREDENTIALS para enviar pushes."
      );
    }
  }

  isConfigured(): boolean {
    return this.app != null;
  }

  async sendToTopic(params: SendToTopicParams): Promise<string> {
    if (!this.app) {
      throw new AppError(
        "FCM no está configurado en el servidor (faltan credenciales de Firebase)",
        503
      );
    }

    const topic = params.topicSlug.replace(/^\/+|\/+$/g, "");
    if (!/^[a-zA-Z0-9-_.~%]+$/.test(topic)) {
      throw new AppError("topicSlug tiene caracteres no permitidos para FCM", 400);
    }

    const data: Record<string, string> = {};
    if (params.data) {
      for (const [k, v] of Object.entries(params.data)) {
        data[k] = String(v);
      }
    }

    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: params.title,
        body: params.body,
      },
      data: Object.keys(data).length > 0 ? data : undefined,
      android: { priority: "high" },
    };

    try {
      return await admin.messaging().send(message);
    } catch (e: any) {
      const msg = e?.message ?? "Error desconocido al enviar FCM";
      console.error("[FCM] sendToTopic error:", e);
      throw new AppError(`Error FCM: ${msg}`, 502);
    }
  }
}
