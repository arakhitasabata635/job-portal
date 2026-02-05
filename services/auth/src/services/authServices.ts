import { sql } from "../db/index.js";
import { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import { UserDTO } from "../types/user.js";
import { AppError } from "../utils/errorClass.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

export const registerUserService = async ({
  name,
  email,
  password,
  phoneNumber,
  role,
}: RegisterInput): Promise<UserDTO> => {
  const existingUser =
    await sql`SELECT user_id FROM users WHERE email=${email}`;

  if (existingUser.length) {
    throw new AppError(409, "User already Exist.");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const [user] =
    await sql`INSERT INTO users (name, email, password, phone_number, role) VALUES (${name}, ${email}, ${hashPassword},${phoneNumber}, ${role}) RETURNING 
      user_id ,name,email,phone_number,role,created_at`;
  if (!user) {
    throw new AppError(
      500,
      "An unexpected error occurred. Please try again later",
    );
  }
  const userDTO: UserDTO = {
    id: user.user_id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phone_number,
    role: user.role,
    createdAt: user.created_at,
  };
  return userDTO;
};

export const loginUserService = async ({ email, password }: LoginInput) => {
  const [user] = await sql`
    SELECT user_id,name,email,password,role,phone_number,created_at FROM users WHERE email = ${email};
  `;
  if (!user) throw new AppError(401, "Invalid email or password");
  const passMatch = await bcrypt.compare(password, user.password);
  if (!passMatch) throw new AppError(401, "Invalid email or password");
  const userDTO: UserDTO = {
    id: user.user_id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phone_number,
    role: user.role,
    createdAt: user.created_at,
  };
  const accessToken = generateAccessToken(userDTO.email, userDTO.role);
  const refreshToken = generateRefreshToken(userDTO.email);
  return { userDTO, accessToken, refreshToken };
};
