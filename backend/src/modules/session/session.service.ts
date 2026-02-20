import bcrypt from 'bcrypt';
import { AppError } from '../../shared/errors/appError.js';

import { generateSessionTokens, verifyAccessToken, verifyRefreshToken } from './auth.token.js';
import { RefreshTokenResponse } from './session.type.js';

import * as authRepo from '../auth/auth.repository.js';
import * as sessionRepo from './session.repository.js';
import * as hash from '../../shared/helpers/hash.helper.js';
import { UserDTO } from '../auth/auth.types.js';
import crypto from 'crypto';

/* ======================================
   SESSION CREATION
====================================== */
export const createSessionForUser = async (
  userDTO: UserDTO,
  deviceInfo: string,
  ipAddress: string | null,
): Promise<RefreshTokenResponse> => {
  const sessionId = crypto.randomUUID(); // create rendom session id
  const { accessToken, refreshToken } = generateSessionTokens(userDTO.userId, userDTO.role, sessionId);
  // hash token and update db
  const tokenHash = hash.sha256Hash(refreshToken);
  await sessionRepo.createSession({
    sessionId,
    userId: userDTO.userId,
    tokenHash,
    deviceInfo,
    ipAddress,
  });

  return { accessToken, refreshToken };
};

/* ======================================
   REFRESH SESSION 
====================================== */
export const refreshSessionService = async (oldRefreshToken: string): Promise<RefreshTokenResponse> => {
  //only validate secreate key not expiry
  const decoded = verifyRefreshToken(oldRefreshToken);

  const session = await sessionRepo.findSessionBySessionId(decoded.sessionId);

  // session not in db means reuse token. it detect the expire tokens stollen
  if (!session) {
    await sessionRepo.deleteAllSessionsByUser(decoded.userId);
    throw new AppError(401, 'Session reuse detected. Login again.');
  }

  const hashToken = hash.sha256Hash(oldRefreshToken);

  // heandle the active session reuse detaction
  if (hashToken !== session.token_hash) {
    await sessionRepo.deleteAllSessionsByUser(decoded.userId);
    throw new AppError(401, 'Session reuse detected. Login again.');
  }

  // check the expiry of the token
  if (decoded.exp! * 1000 < Date.now()) {
    await sessionRepo.deleteSessionById(session.session_id);
    throw new AppError(401, 'Refresh token expired');
  }

  //FIND  role
  const user = await authRepo.findUserByid(decoded.userId);
  if (!user) throw new AppError(404, 'User no longer exist');
  //create tokens

  const { accessToken, refreshToken } = generateSessionTokens(user.user_id, user.role, decoded.sessionId);
  // hash token and update db
  const hashRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await sessionRepo.updateSessionToken(session.session_id, hashRefresh);

  return { accessToken, refreshToken };
};
/* ======================================
   LOGOUT SINGLE
====================================== */
export const singleLogoutService = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken);

  const session = await sessionRepo.findSessionBySessionId(decoded.sessionId);

  if (!session) {
    throw new AppError(200, 'Already logout');
  }
  return await sessionRepo.deleteSessionById(decoded.sessionId);
};

/* ======================================
   ALL LOGOUT
====================================== */

export const allLogoutService = async (token: string) => {
  const decoded = verifyAccessToken(token);
  return await sessionRepo.deleteAllSessionsByUser(decoded.userId);
};
