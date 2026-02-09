import { sql } from "../db/index.js";
import { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import { UserDTO } from "../types/user.js";
import { AppError } from "../utils/errorClass.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
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
      user_id ,name,email,email_verified,phone_number,role,created_at`;
  if (!user) {
    throw new AppError(
      500,
      "An unexpected error occurred. Please try again later",
    );
  }
  const userDTO: UserDTO = {
    userId: user.user_id,
    name: user.name,
    email: user.email,
    isEmailVerify: user.email_verified,
    phoneNumber: user.phone_number,
    role: user.role,
    createdAt: user.created_at,
  };
  return userDTO;
};

export const loginUserService = async (
  { email, password }: LoginInput,
  sessionInfo: { deviceInfo: string; ipAddress: string | null },
) => {
  const [user] = await sql`
    SELECT user_id,name,email,email_verified,password,role,phone_number,created_at FROM users WHERE email = ${email};
  `;
  if (!user) throw new AppError(401, "Invalid email or password");
  const passMatch = await bcrypt.compare(password, user.password);
  if (!passMatch) throw new AppError(401, "Invalid email or password");
  const userDTO: UserDTO = {
    userId: user.user_id,
    name: user.name,
    email: user.email,
    isEmailVerify: user.email_verified,
    phoneNumber: user.phone_number,
    role: user.role,
    createdAt: user.created_at,
  };

  const accessToken = generateAccessToken({
    userId: userDTO.userId,
    role: userDTO.role,
  });

  const sessionId = randomUUID(); // create rendom session id
  const refreshToken = generateRefreshToken({
    userId: userDTO.userId,
    sessionId,
  });

  const hashRefresh = await bcrypt.hash(refreshToken, 10);

  await sql`
  INSERT INTO refresh_tokens (session_id,user_id, token_hash, device_info, ip_address)
  VALUES (${sessionId},${userDTO.userId}, ${hashRefresh}, ${sessionInfo.deviceInfo}, ${sessionInfo.ipAddress})
 ;
`;
  return { userDTO, accessToken, refreshToken };
};

export const createAccessTokenService = async (refreshToken: string) => {
  //valid token
  const decoded = verifyRefreshToken(refreshToken);
  const [session] = await sql`
  SELECT *
  FROM refresh_tokens
  WHERE session_id = ${decoded.sessionId};
`;
  // session not in db
  if (!session) {
    await sql`DELETE FROM refresh_tokens WHERE user_id = ${decoded.userId}`;
    throw new AppError(401, "Session reuse detected. Login again.");
  }

  const match = await bcrypt.compare(refreshToken, session.token_hash);
  // bcrypt compare fail
  if (!match) {
    await sql`DELETE FROM refresh_tokens WHERE user_id = ${decoded.userId}`;
    throw new AppError(401, "Session reuse detected. Login again.");
  }

  //FIND  role
  const [user] =
    await sql`SELECT role FROM users WHERE user_id=${decoded.userId} `;
  if (!user) throw new AppError(404, "User no longer exist");
  //create tokens
  const accessToken = generateAccessToken({
    userId: session.user_id,
    role: user.role,
  });

  const newRefreshToken = generateRefreshToken({
    userId: session.user_id,
    sessionId: session.session_id,
  });
  // hash token and update db
  const hashRefresh = await bcrypt.hash(newRefreshToken, 10);
  await sql`
  UPDATE refresh_tokens
  SET token_hash = ${hashRefresh},
  created_at= NOW(),
  expires_at = NOW() + INTERVAL '7 days'
  WHERE session_id = ${session.session_id};
`;
  return { accessToken, newRefreshToken };
};

export const singleLogoutService = async (refreshToken: string) => {
  const decode = verifyRefreshToken(refreshToken);

  const [session] = await sql`
 SELECT * FROM refresh_tokens WHERE session_id= ${decode.sessionId}
`;
  if (!session) {
    throw new AppError(204, "Already logout");
  }
  return await sql`
  DELETE FROM refresh_tokens WHERE session_id = ${session.session_id}`;
};

export const allLogoutService = async (token: string) => {
  const decoded = verifyAccessToken(token);

  const sessions = await sql`
 SELECT * FROM refresh_tokens WHERE user_id= ${decoded.userId}
`;
  if (sessions.length < 1) {
    throw new AppError(204, "No session Exist");
  }
  return await sql`DELETE FROM refresh_tokens WHERE user_id = ${decoded.userId}`;
};
