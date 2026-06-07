export interface ProfileResponse {
  id: number;
  username: string;
  name: string;
  lastname: string;
  email: string;
  phone: string | null;
  role: string;
  jobTitle: string | null;
  lastLogin: string | null;
  isActive: boolean;
}

export interface ProfilePersonalUpdate {
  name: string;
  lastname: string;
  phone: string;
}

export interface ProfilePasswordUpdate {
  currentPassword: string;
  newPassword: string;
}
