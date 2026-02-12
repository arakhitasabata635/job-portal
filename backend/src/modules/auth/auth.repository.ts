import { sql } from '../../config/db.js';
import { UserRole } from '../../types/role.js';
import { UserEntity } from './auth.types.js';

// find user using email

export const findUserByEmail = async (email: string): Promise<UserEntity | null> => {
  const [user] = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;

  if (!user) return null;
  const findUser = user as UserEntity;
  return findUser;
};

//find user using userId

export const findUserByid = async (userId: string): Promise<UserEntity | null> => {
  const [user] = await sql`
SELECT * FROM users WHERE user_id = ${userId}
`;

  if (!user) return null;
  const findUser = user as UserEntity;
  return findUser;
};

// create user
interface CreateUserInput {
  name: string;
  email: string;
  password?: string | null;
  phoneNumber?: string | null;
  role?: UserRole;
  emailVerified?: boolean;
}

export const createUser = async (data: CreateUserInput): Promise<UserEntity | null> => {
  const [user] = await sql`
    INSERT INTO users (name, email, password, phone_number, role, email_verified)
    VALUES (
      ${data.name},
      ${data.email},
      ${data.password ?? null},
      ${data.phoneNumber ?? null},
      ${data.role ?? 'jobseeker'},
      ${data.emailVerified ?? false}
    )
    RETURNING *;
  `;

  if (!user) return null;
  const findUser = user as UserEntity;
  return findUser;
};
