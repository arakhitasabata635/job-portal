import { sql } from "../db/index.js";
import { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import { UserDTO } from "../types/user.js";
import { AppError } from "../utils/errorClass.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { randomUUID } from "node:crypto";

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

export const loginUserService = async (
  { email, password }: LoginInput,
  sessionInfo: { deviceInfo: string; ipAddress: string },
) => {
  const [user] = await sql`
    SELECT user_id,name,email,email_varified,password,role,phone_number,created_at FROM users WHERE email = ${email};
  `;
  if (!user) throw new AppError(401, "Invalid email or password");
  const passMatch = await bcrypt.compare(password, user.password);
  if (!passMatch) throw new AppError(401, "Invalid email or password");
  const userDTO: UserDTO = {
    id: user.user_id,
    name: user.name,
    email: user.email,
    isEmailVerify: user.email_varified,
    phoneNumber: user.phone_number,
    role: user.role,
    createdAt: user.created_at,
  };

  const accessToken = generateAccessToken({
    id: userDTO.id,
    email: userDTO.email,
    role: userDTO.role,
  });

  const sessionId = randomUUID(); // create rendom session id
  const refreshToken = generateRefreshToken({
    id: userDTO.id,
    session_id: sessionId,
  });

  const hashRefresh = await bcrypt.hash(refreshToken, 10);

  await sql`
  INSERT INTO refresh_tokens (session_id,user_id, token_hash, device_info, ip_address)
  VALUES (${sessionId},${userDTO.id}, ${hashRefresh}, ${sessionInfo.deviceInfo}, ${sessionInfo.ipAddress})
 ;
`;
  return { userDTO, accessToken, refreshToken };
};

export const createAccessTokenService = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken);
  const [user] = await sql`
  SELECT user_id, name, email, role, phone_number, created_at,refresh_token
  FROM users
  WHERE user_id = ${decoded.id};
`;
  if (!user) {
    throw new AppError(401, "User no longer exists");
  }
  if (user.refresh_token !== refreshToken) {
    await sql`
    UPDATE users
    SET refresh_token = NULL
    WHERE user_id = ${user.user_id};
`;
    throw new AppError(401, "token not valid");
  }
  const accessToken = generateAccessToken({
    id: user.user_id,
    email: user.email,
    role: user.role,
  });
  const newRefreshToken = generateRefreshToken({
    id: user.user_id,
    session_id: user.email,
  });
  await sql`
  UPDATE users
  SET refresh_token = ${newRefreshToken}
  WHERE user_id = ${user.user_id};
`;
  return { accessToken, newRefreshToken };
};

export const logoutService = async (refreshToken: string) => {
  const decode = verifyRefreshToken(refreshToken);

  const [session] = await sql`
 SELECT * FROM refresh_tokens WHERE session_id= ${decode.session_id}
`;
  if (!session) {
    throw new AppError(204, "Already logout");
  }
  const result = await bcrypt.compare(refreshToken, session.token_hash);
  if (!result) {
    throw new AppError(401, "Invalid or Wrong session ID.");
  }
  return await sql`
  DELETE FROM refresh_tokens WHERE session_id = ${session.session_id}`;
};
