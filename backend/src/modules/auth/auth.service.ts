import { sql } from "../../config/db.js";
import { LoginInput, RegisterInput } from "./auth.schema.js";
import { UserDTO } from "../../types/user.js";
import { AppError } from "../../shared/errors/appError.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./auth.token.js";
import crypto from "crypto";
import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import * as authRepo from "./auth.repository.js";
import { toUserDTO } from "./auth.mapper.js";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export const registerUserService = async ({
  name,
  email,
  password,
  phoneNumber,
  role,
}: RegisterInput): Promise<UserDTO> => {
  const existingUser = await authRepo.findUserByEmail(email);

  if (existingUser) {
    throw new AppError(409, "User already Exist.");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const user = await authRepo.createUser({
    name,
    email,
    hashPassword,
    phoneNumber,
    role,
  });
  if (!user) {
    throw new AppError(500, "An unexpected error occurred. Please try again.");
  }

  const userDTO = toUserDTO(user);
  return userDTO;
};

export const loginUserService = async (
  { email, password }: LoginInput,
  sessionInfo: { deviceInfo: string; ipAddress: string | null },
) => {
  const user = await authRepo.findUserByEmail(email);
  if (!user) throw new AppError(401, "Invalid email or password");
  const passMatch = await bcrypt.compare(password, user.password);
  if (!passMatch) throw new AppError(401, "Invalid email or password");

  const userDTO = toUserDTO(user);

  const accessToken = generateAccessToken({
    userId: userDTO.userId,
    role: userDTO.role,
  });

  const sessionId = crypto.randomUUID(); // create rendom session id
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

export const generateGoogleOauthURLService = async () => {
  const state = crypto.randomBytes(16).toString("hex");
  const codeVerifier = crypto.randomBytes(32).toString("hex");

  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const url = client.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
  });
  return { url, codeVerifier, state };
};

export const googleCallbackService = async (
  codeVerifier: string,
  code: string,
  device: { deviceInfo: string; ipAddress: string | null },
) => {
  const { tokens } = await client.getToken({
    code,
    codeVerifier,
  });

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID as string,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new AppError(401, "Invalid Google token");
  const { sub, email, email_verified, name } = payload as {
    sub: string;
    email: string;
    email_verified: boolean;
    name: string;
  };

  const [existingOauth] = await sql`
  SELECT * FROM oauth_accounts 
  WHERE provider_user_id=${sub}
  AND provider = 'google'
  `;

  let userId;
  let role;
  let user;
  if (existingOauth) {
    userId = existingOauth.user_id;
    role = existingOauth.role;
  } else {
    const existingUser = await authRepo.findUserByEmail(email);

    if (existingUser) {
      userId = existingUser.user_id;
      role = existingUser.role;
    } else {
      const user = await authRepo.createUser({
        name,
        email,
        emailVerified: email_verified,
      });

      if (!user) throw new AppError(500, "User not created please try again");
      userId = user.user_id;
      role = user.role;
    }
    await sql`
      INSERT INTO oauth_accounts
      (user_id, provider, provider_user_id, role)
      VALUES (${userId}, 'google', ${sub}, ${role});
    `;
  }
  //create tokens

  const accessToken = generateAccessToken({
    userId: userId,
    role: role,
  });

  const sessionId = crypto.randomUUID(); // create rendom session id
  const refreshToken = generateRefreshToken({
    userId: userId,
    sessionId,
  });

  const hashRefresh = await bcrypt.hash(refreshToken, 10);

  await sql`
  INSERT INTO refresh_tokens (session_id,user_id, token_hash, device_info, ip_address)
  VALUES (${sessionId},${userId}, ${hashRefresh}, ${device.deviceInfo}, ${device.ipAddress})
 ;
`;
  const userDTO = toUserDTO(user);
  return { userDTO, accessToken, refreshToken };
};
