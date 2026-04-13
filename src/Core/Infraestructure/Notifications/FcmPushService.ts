import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import {
  FcmPushPort,
  SendToTopicParams,
} from "src/Core/Application/Ports/FcmPushPort.interface";
import { AppError } from "src/shared/Errors/AppErrors";

const LOG_DIR = path.join(process.cwd(), "logs");
const AUDIT_LOG_FILE = path.join(LOG_DIR, "logs.txt");
const MAX_TEXT_AUDIT = 500;

function appendFcmAudit(record: Record<string, unknown>): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    const line =
      JSON.stringify({ ts: new Date().toISOString(), component: "FcmPushService", ...record }) +
      "\n";
    fs.appendFileSync(AUDIT_LOG_FILE, line, { encoding: "utf8" });
  } catch (err) {
    console.error("[FCM-AUDIT] No se pudo escribir en logs.txt:", err);
  }
}

function truncateForAudit(text: string, max = MAX_TEXT_AUDIT): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…[truncado,len=${text.length}]`;
}

function summarizePayload(params: SendToTopicParams): Record<string, unknown> {
  return {
    topicSlug: params.topicSlug,
    title: truncateForAudit(params.title ?? ""),
    titleLen: (params.title ?? "").length,
    body: truncateForAudit(params.body ?? ""),
    bodyLen: (params.body ?? "").length,
    data: params.data ?? null,
    dataKeys: params.data ? Object.keys(params.data) : [],
  };
}

function tryInitializeFirebase(): admin.app.App | null {
  if (admin.apps.length > 0) {
    appendFcmAudit({
      event: "firebase_init",
      status: "reuse_existing_app",
    });
    return admin.app();
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      const cred = JSON.parse(json) as admin.ServiceAccount;
      appendFcmAudit({
        event: "firebase_init",
        status: "ok",
        source: "FIREBASE_SERVICE_ACCOUNT_JSON",
        projectId: cred.projectId ?? "(sin projectId en JSON)",
      });
      return admin.initializeApp({
        credential: admin.credential.cert(cred),
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      appendFcmAudit({
        event: "firebase_init",
        status: "error",
        source: "FIREBASE_SERVICE_ACCOUNT_JSON",
        error: message,
      });
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
      appendFcmAudit({
        event: "firebase_init",
        status: "ok",
        source: "GOOGLE_APPLICATION_CREDENTIALS",
        credentialsPath: file,
      });
      return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      appendFcmAudit({
        event: "firebase_init",
        status: "error",
        source: "GOOGLE_APPLICATION_CREDENTIALS",
        credentialsPath: file,
        error: message,
      });
      console.error(
        "[FCM] No se pudo inicializar con GOOGLE_APPLICATION_CREDENTIALS:",
        e
      );
      return null;
    }
  }

  appendFcmAudit({
    event: "firebase_init",
    status: "skipped",
    reason: "sin FIREBASE_SERVICE_ACCOUNT_JSON ni GOOGLE_APPLICATION_CREDENTIALS",
  });
  return null;
}

export class FirebaseAdminFcmPushService implements FcmPushPort {
  private app: admin.app.App | null;

  constructor() {
    this.app = tryInitializeFirebase();
    if (!this.app) {
      appendFcmAudit({
        event: "fcm_service_ready",
        configured: false,
      });
      console.warn(
        "[FCM] Sin credenciales: define FIREBASE_SERVICE_ACCOUNT_JSON o GOOGLE_APPLICATION_CREDENTIALS para enviar pushes."
      );
    } else {
      appendFcmAudit({
        event: "fcm_service_ready",
        configured: true,
      });
    }
  }

  isConfigured(): boolean {
    return this.app != null;
  }

  async sendToTopic(params: SendToTopicParams): Promise<string> {
    appendFcmAudit({
      event: "send_to_topic_attempt",
      payload: summarizePayload(params),
    });

    if (!this.app) {
      appendFcmAudit({
        event: "send_to_topic_blocked",
        reason: "fcm_not_configured",
        topicSlug: params.topicSlug,
      });
      throw new AppError(
        "FCM no está configurado en el servidor (faltan credenciales de Firebase)",
        503
      );
    }

    const topic = params.topicSlug.replace(/^\/+|\/+$/g, "");
    if (!/^[a-zA-Z0-9-_.~%]+$/.test(topic)) {
      appendFcmAudit({
        event: "send_to_topic_validation_error",
        topicSlug: params.topicSlug,
        normalizedTopic: topic,
        error: "topicSlug con caracteres no permitidos para FCM",
      });
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

    appendFcmAudit({
      event: "send_to_topic_fcm_message_built",
      topic,
      hasData: Object.keys(data).length > 0,
      dataEntries: Object.keys(data).length,
    });

    try {
      const messageId = await admin.messaging().send(message);
      appendFcmAudit({
        event: "send_to_topic_success",
        topic,
        messageId,
      });
      return messageId;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code?: unknown }).code)
          : undefined;
      appendFcmAudit({
        event: "send_to_topic_error",
        topic,
        errorMessage: msg,
        errorCode: code,
        stack: e instanceof Error ? truncateForAudit(e.stack ?? "", 800) : undefined,
      });
      console.error("[FCM] sendToTopic error:", e);
      throw new AppError(`Error FCM: ${msg}`, 502);
    }
  }
}
