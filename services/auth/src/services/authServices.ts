import { sql } from "../db/index.js";
import { RegisterInput } from "../schemas/auth.schema.js";
import { AppError } from "../utils/errorClass.js";
import bcrypt from "bcrypt";

export const resisterUserService = async ({
  name,
  email,
  password,
  phoneNumber,
  role,
}: RegisterInput) => {
  const existingUser =
    await sql`SELECT user_id FROM users WHERE email=${email}`;

  if (existingUser.length) {
    throw new AppError(409, "User already Exist.");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const [user] =
    await sql`INSERT INTO users (name, email, password, phone_number, role) VALUES (${name}, ${email}, ${hashPassword},${phoneNumber}, ${role}) RETURNING 
      user_id ,name,email,phone_number,role,created_at`;
  return user;
};
