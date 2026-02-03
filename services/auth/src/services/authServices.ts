import { sql } from "../db/index.js";
import { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
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

export const loginUserService = async ({ email, password }: LoginInput) => {
  const [user] = await sql`
    SELECT user_id,name,email,password,role,phone_number FROM users WHERE email = ${email};
  `;
  if (!user) throw new AppError(401, "Invalid email or password");
  const passMatch = await bcrypt.compare(password, user.password);
  if (!passMatch) throw new AppError(401, "Invalid email or password");
  return user;
};
