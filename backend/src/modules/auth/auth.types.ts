import { UserRole } from '../../types/role.js';

/* ================================
   Database Entity (Raw DB Shape)
   Represents exactly what DB returns
================================ */
export interface UserEntity {
  user_id: string;
  name: string;
  email: string;
  password: string | null;
  email_verified: boolean;
  phone_number: string | null;
  role: UserRole;
  bio?: string | null;
  resume?: string | null;
  resume_public_id?: string | null;
  profile_pic?: string | null;
  profile_pic_public_id?: string | null;
  created_at: Date;
  subscription?: Date | null;
}

/* ================================
   Safe API Response DTO
   Never include password
================================ */
export interface UserDTO {
  userId: string;
  name: string;
  email: string;
  isEmailVerify: boolean;
  phoneNumber: string | null;
  role: UserRole;
  createdAt: Date;
}

/* ================================
   Session Info (Controller → Service)
================================ */
export interface SessionInfo {
  deviceInfo: string;
  ipAddress: string | null;
}

/* ================================
   Auth Responses
================================ */
export interface LoginResponse {
  userDTO: UserDTO;
  accessToken: string;
  refreshToken: string;
}
export interface RefreshTokenResponse {
  accessToken: string;
  newRefreshToken: string;
}
