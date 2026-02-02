import { sql } from "../db/index.js";
import { resisterUser } from "../types/user.js";
import { AppError } from "../utils/errorClass.js";
import bcrypt from "bcrypt";

export const resisterUserService = async ({
  name,
  email,
  password,
  phoneNumber,
  role,
}: resisterUser) => {
  if (!name || !email || !password || !phoneNumber || !role) {
    throw new AppError(400, "Please fill all the details.");
  }
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
