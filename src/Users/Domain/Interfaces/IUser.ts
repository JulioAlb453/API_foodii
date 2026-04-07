export interface IUser {
  id: string;
  username: string;
  password: string;
  fcmToken?: string | null;
  notificationCategoryPreferences?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}