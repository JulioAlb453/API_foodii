export interface IUser {
  id: string;
  username: string;
  password: string;
  /** Token FCM para push; opcional. Un mismo token solo debe estar asignado a un usuario (ver login). */
  fcmToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}