import { UserDTO } from './auth.types.js';

export const toUserDTO = (user: any): UserDTO => {
  return {
    userId: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phone_number,
    isEmailVerify: user.email_verified,
    createdAt: user.created_at,
  };
};
