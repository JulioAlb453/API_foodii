import { FirebaseAdminFcmPushService } from "src/Core/Infraestructure/Notifications/FcmPushService";
import { NotificationsController } from "src/Users/infrastructure/Controllers/NotificationsController";

export function createNotificationPushDependencies() {
  const fcmPushPort = new FirebaseAdminFcmPushService();
  const notificationsController = new NotificationsController(fcmPushPort);
  return { fcmPushPort, notificationsController };
}
