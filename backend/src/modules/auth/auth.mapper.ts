import { UserDTO } from '../../types/user.js';

export const toUserDTO = (user: any): UserDTO => {
  return {
    userId: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerify: user.email_verified,
    createdAt: user.created_at,
  };
};
