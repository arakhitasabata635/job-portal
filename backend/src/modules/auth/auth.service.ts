import { config } from '../../config/env.js';
import { LoginInput, RegisterInput } from './auth.schema.js';
import { AppError } from '../../shared/errors/appError.js';
import bcrypt from 'bcrypt';
import { verifyAccessToken, verifyRefreshToken } from './auth.token.js';
import crypto from 'crypto';
import { TokenPayload } from 'google-auth-library';
import * as authRepo from './auth.repository.js';
import { toUserDTO } from './auth.mapper.js';
import { LoginResponse, RefreshTokenResponse, SessionInfo, UserDTO, UserEntity } from './auth.types.js';
import * as sessionRepo from './session.repository.js';
import * as oauthRepo from './oauth.repository.js';
import { generateSessionTokens } from '../../shared/helpers/auth.token.helper.js';
import { verifyGoogleToken } from '../oauth/google.service.js';

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

export const googleCallbackService = async (codeVerifier: string, code: string, sessionInfo: SessionInfo) => {
  const payload = await verifyGoogleToken(codeVerifier, code);

  const userDetails = await findOrCreateUserFromGoogle(payload);
  //create tokens
  const sessionId = crypto.randomUUID(); // create rendom session id
  const { accessToken, refreshToken } = generateSessionTokens(userDetails.user_id, userDetails.role, sessionId);

  const tokenHash = await bcrypt.hash(refreshToken, 10);

  await sessionRepo.createSession({
    sessionId,
    userId: userDetails.user_id,
    tokenHash,
    deviceInfo: sessionInfo.deviceInfo,
    ipAddress: sessionInfo.ipAddress,
  });

  const userDTO = toUserDTO(userDetails);
  return { userDTO, accessToken, refreshToken };
};

const findOrCreateUserFromGoogle = async (payload: TokenPayload): Promise<UserEntity> => {
  // check token got payload
  const { sub, email, email_verified, name } = payload;

  if (!email || !email_verified) throw new AppError(401, 'A verified email is required.');

  const existingOauth = await oauthRepo.findOauthAccount('google', sub);

  let userDetails;

  if (existingOauth) {
    const user = await authRepo.findUserByid(existingOauth.user_id);
    userDetails = user;
  } else {
    const existingUser = await authRepo.findUserByEmail(email);

    if (existingUser) {
      userDetails = existingUser;
    } else {
      const user = await authRepo.createUser({ name: name || '', email, emailVerified: email_verified });
      if (!user) throw new AppError(500, 'User not created please try again');
      await oauthRepo.createOauthAccount(user.user_id, 'google', sub);
      userDetails = user;
    }
  }

  if (!userDetails) throw new AppError(500, 'User not created please try again');
  return userDetails;
};
