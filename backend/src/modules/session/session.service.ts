import bcrypt from 'bcrypt';
import { AppError } from '../../shared/errors/appError.js';

import { generateSessionTokens, verifyAccessToken, verifyRefreshToken } from './auth.token.js';
import { RefreshTokenResponse } from './session.type.js';

import * as authRepo from '../auth/auth.repository.js';
import * as sessionRepo from './session.repository.js';
import { UserDTO } from '../auth/auth.types.js';

export const createSessionForUser = async (
  userDTO: UserDTO,
  deviceInfo: string,
  ipAddress: string,
): Promise<RefreshTokenResponse> => {
  const sessionId = crypto.randomUUID(); // create rendom session id
  const { accessToken, refreshToken } = generateSessionTokens(userDTO.userId, userDTO.role, sessionId);
  // hash token and update db
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  await sessionRepo.createSession({ sessionId, userId: userDTO.userId, tokenHash, deviceInfo, ipAddress });

  return { accessToken, refreshToken };
};

export const refreshSessionService = async (refreshToken: string): Promise<RefreshTokenResponse> => {
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

  return { accessToken, refreshToken: newRefreshToken };
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
