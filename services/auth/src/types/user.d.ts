export type UserRole = "jobseeker" | "recruiter";

export interface UserRow {
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  role: UserRole;
  created_at: Date;
}
export interface UserDTO {
  id: number;
  name: string;
  email: string;
  isEmailVerify?: boolean;
  phoneNumber: string;
  role: UserRole;
  createdAt: Date;
}
