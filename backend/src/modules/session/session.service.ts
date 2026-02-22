import { AppError } from '../../shared/errors/appError.js';

import * as sessionToken from './auth.token.js';
import { RefreshTokenResponse } from './session.type.js';

import * as authRepo from '../auth/auth.repository.js';
import * as sessionRepo from './session.repository.js';
import * as hash from '../../shared/helpers/hash.helper.js';
import { UserDTO } from '../auth/auth.types.js';
import crypto from 'crypto';
import * as sessionUtils from './session.utils.js';

/* ======================================
   SESSION CREATION
====================================== */
export const createSessionForUser = async (
  userDTO: UserDTO,
  deviceInfo: string,
  ipAddress: string | null,
): Promise<RefreshTokenResponse> => {
  const sessionId = crypto.randomUUID(); // create rendom session id
  const { accessToken, refreshToken } = sessionToken.generateSessionTokens(userDTO.userId, userDTO.role, sessionId);
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
  const decoded = sessionToken.verifyRefreshToken(oldRefreshToken);

  const session = await sessionRepo.findSessionBySessionId(decoded.sessionId);

  //check session reuse
  try {
    sessionUtils.isSessionReuse(session, oldRefreshToken);
  } catch {
    await sessionRepo.deleteAllSessionsByUser(decoded.userId);
    throw new AppError(401, 'Session reuse detected. Login again.');
  }

  // check the expiry of the token
  if (sessionUtils.isTokenExp(decoded.exp!)) {
    await sessionRepo.deleteSessionById(session!.session_id);
    throw new AppError(401, 'Session got expire. Login again.');
  }

  //FIND  role
  const user = await authRepo.findUserByid(decoded.userId);
  if (!user) throw new AppError(404, 'User no longer exist');
  //create tokens

  const { accessToken, refreshToken } = sessionToken.generateSessionTokens(user.user_id, user.role, decoded.sessionId);
  // hash token and update db
  const hashRefresh = hash.sha256Hash(refreshToken);
  await sessionRepo.updateSessionToken(session!.session_id, hashRefresh);

  return { accessToken, refreshToken };
};
/* ======================================
   LOGOUT SINGLE
====================================== */
export const singleLogoutService = async (refreshToken: string) => {
  const decoded = sessionToken.verifyRefreshToken(refreshToken);

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
  const decoded = sessionToken.verifyAccessToken(token);
  return await sessionRepo.deleteAllSessionsByUser(decoded.userId);
};
