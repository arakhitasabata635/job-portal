import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

//types
import { toUserDTO } from './auth.mapper.js';
import { LoginInput, RegisterInput } from './auth.schema.js';
import { LoginResponse, RefreshTokenResponse, SessionInfo, UserDTO, UserEntity } from './auth.types.js';

//repository
import * as authRepo from './auth.repository.js';

//tokens
import { verifyAccessToken, verifyRefreshToken } from '../session/auth.token.js';
import { generateSessionTokens } from '../../shared/helpers/auth.token.helper.js';

/* ======================================
   REGISTER
====================================== */
export const registerUserService = async (input: RegisterInput): Promise<UserDTO> => {
  const existingUser = await authRepo.findUserByEmail(input.email);

  if (existingUser) {
    throw new AppError(409, 'User already Exist.');
  }

  const hashpassword = await bcrypt.hash(input.password, 10);

  const user = await authRepo.createUser({
    name: input.name,
    email: input.email,
    password: hashpassword,
    phoneNumber: input.phoneNumber,
    role: input.role,
  });
  if (!user) {
    throw new AppError(500, 'An unexpected error occurred. Please try again.');
  }

  const userDTO = toUserDTO(user);
  return userDTO;
};

/* ======================================
   LOGIN
====================================== */
export const loginUserService = async (input: LoginInput, sessionInfo: SessionInfo): Promise<LoginResponse> => {
  const user = await authRepo.findUserByEmail(input.email);

  if (!user) throw new AppError(401, 'Invalid email or password');
  if (!user.password) throw new AppError(401, 'Invalid email or password');

  const passMatch = await bcrypt.compare(input.password, user.password);
  if (!passMatch) throw new AppError(401, 'Invalid email or password');

  const userDTO = toUserDTO(user);
  const sessionId = crypto.randomUUID(); // create rendom session id
  const { accessToken, refreshToken } = generateSessionTokens(userDTO.userId, userDTO.role, sessionId);
  const hashRefresh = await bcrypt.hash(refreshToken, 10);

  await sessionRepo.createSession({
    sessionId,
    userId: userDTO.userId,
    tokenHash: hashRefresh,
    deviceInfo: sessionInfo.deviceInfo,
    ipAddress: sessionInfo.ipAddress,
  });
  return { userDTO, accessToken, refreshToken };
};

/* ======================================
   REFRESH TOKEN
====================================== */
export const createAccessTokenService = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  //valid token
  const decoded = verifyRefreshToken(refreshToken);
  const session = await sessionRepo.findSessionBySessionId(decoded.sessionId);

  // session not in db
  if (!session) {
    await sessionRepo.deleteAllSessionsByUser(decoded.userId);
    throw new AppError(401, 'Session reuse detected. Login again.');
  }

  const match = await bcrypt.compare(refreshToken, session.token_hash);
  // bcrypt compare fail
  if (!match) {
    await sessionRepo.deleteAllSessionsByUser(decoded.userId);
    throw new AppError(401, 'Session reuse detected. Login again.');
  }

  //FIND  role
  const user = await authRepo.findUserByid(decoded.userId);
  if (!user) throw new AppError(404, 'User no longer exist');
  //create tokens
  const sessionId = crypto.randomUUID(); // create rendom session id
  const { accessToken, refreshToken: newRefreshToken } = generateSessionTokens(user.user_id, user.role, sessionId);
  // hash token and update db
  const hashRefresh = await bcrypt.hash(newRefreshToken, 10);
  await sessionRepo.updateSessionToken(session.session_id, hashRefresh);

  return { accessToken, newRefreshToken };
};

export const singleLogoutService = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken);

  const session = await sessionRepo.findSessionBySessionId(decoded.sessionId);

  if (!session) {
    throw new AppError(204, 'Already logout');
  }
  return await sessionRepo.deleteSessionById(decoded.sessionId);
};

// all session delete using accessToken

export const allLogoutService = async (token: string) => {
  const decoded = verifyAccessToken(token);
  return await sessionRepo.deleteAllSessionsByUser(decoded.userId);
};
