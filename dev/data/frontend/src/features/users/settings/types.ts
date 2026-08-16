export interface ProfileData {
  userId: string; 
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  role: string;
  department: string;
  country: string;
  city: string;
  timeZone: string;
}

export interface PasswordData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type ActiveSection = 'profile' | 'password' | 'privacy';

export interface DataExportRecord {
  requestedAt: string;
  completedAt: string;
}

export interface DeletionRequestRecord {
  requestedAt: string;
  alreadyRequested: boolean;
}