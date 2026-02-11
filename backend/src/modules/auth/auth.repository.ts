import { sql } from '../../config/db.js';
import { UserDTO } from '../../types/user.js';

export const findUserByEmail = async (email: string) => {
  const [user] = await sql`
  SELECT * FROM users WHERE email = ${email}
  `;
  return user || null;
};

export const createUser = async (data: {
  name: string;
  email: string;
  hashpassword?: string;
  phoneNumber?: string;
  role?: string;
  emailVerified?: boolean;
}) => {
  const [user] = await sql`
    INSERT INTO users (name, email, hashpassword, phone_number, role, email_verified)
    VALUES (
      ${data.name},
      ${data.email},
      ${data.hashpassword ?? null},
      ${data.phoneNumber ?? null},
      ${data.role ?? 'jobseeker'},
      ${data.emailVerified ?? false}
    )
    RETURNING *;
  `;
  if (!user) return null;

  const userDTO: UserDTO = {
    userId: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerify: user.email_verified,
    phoneNumber: user.phone_number,
    createdAt: user.created_at,
  };
  return userDTO;
};
