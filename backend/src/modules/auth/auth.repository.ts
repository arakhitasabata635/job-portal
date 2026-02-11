import { sql } from '../../config/db.js';

export const findUserByEmail = async (email: string) => {
  const [user] = await sql`
  SELECT * FROM users WHERE email = ${email}
  `;
  return user || null;
};

export const createUser = async (data: {
  name: string;
  email: string;
  hashPassword?: string;
  phoneNumber?: string;
  role?: string;
  emailVerified?: boolean;
}) => {
  const [user] = await sql`
    INSERT INTO users (name, email, password, phone_number, role, email_verified)
    VALUES (
      ${data.name},
      ${data.email},
      ${data.hashPassword ?? null},
      ${data.phoneNumber ?? null},
      ${data.role ?? 'jobseeker'},
      ${data.emailVerified ?? false}
    )
    RETURNING *;
  `;
  return user || null;
};
