import { config } from '../../config/env.js';
import { LoginInput, RegisterInput } from './auth.schema.js';
import { AppError } from '../../shared/errors/appError.js';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from './auth.token.js';
import crypto from 'crypto';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import * as authRepo from './auth.repository.js';
import { toUserDTO } from './auth.mapper.js';
import { LoginResponse, RefreshTokenResponse, SessionInfo, UserDTO } from './auth.types.js';
import * as sessionRepo from './session.repository.js';
import * as oauthRepo from './oauth.repository.js';

const client = new OAuth2Client(
  config.oauth.google.client_id,
  config.oauth.google.client_secret,
  config.oauth.google.redirect_url,
);

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
  const accessToken = generateAccessToken({
    userId: user.user_id,
    role: user.role,
  });

  const newRefreshToken = generateRefreshToken({
    userId: user.user_id,
    sessionId: session.session_id,
  });
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

export const generateGoogleOauthURLService = async () => {
  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('hex');

  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const url = client.generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    state,
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
  });
  return { url, codeVerifier, state };
};

export const googleCallbackService = async (codeVerifier: string, code: string, sessionInfo: SessionInfo) => {
  const { tokens } = await client.getToken({
    code,
    codeVerifier,
  });

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: config.oauth.google.client_id,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new AppError(401, 'Invalid Google token');
  const { sub, email, email_verified, name } = payload as {
    sub: string;
    email: string;
    email_verified: boolean;
    name: string;
  };

  const existingOauth = await oauthRepo.findOauthAccount('google', sub);

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
      const user = await authRepo.createUser({ name, email, emailVerified: email_verified });
      if (!user) throw new AppError(500, 'User not created please try again');
      userId = user.user_id;
      role = user.role;
    }

    await oauthRepo.createOauthAccount(userId, 'google', sub, role);
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

  const tokenHash = await bcrypt.hash(refreshToken, 10);

  await sessionRepo.createSession({
    sessionId,
    userId,
    tokenHash,
    deviceInfo: sessionInfo.deviceInfo,
    ipAddress: sessionInfo.ipAddress,
  });

  const userDTO = toUserDTO(user);
  return { userDTO, accessToken, refreshToken };
};
