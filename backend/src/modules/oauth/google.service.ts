import { CodeChallengeMethod, OAuth2Client, TokenPayload } from 'google-auth-library';
import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { SessionInfo, UserEntity } from '../auth/auth.types.js';
import { createOauthAccount, findOauthAccount } from './oauth.repository.js';
import { createUser, findUserByEmail, findUserByid } from '../auth/repository/auth.repository.js';
import { generateSessionTokens } from '../../shared/helpers/auth.token.helper.js';
import { createSession } from '../auth/repository/session.repository.js';
import { toUserDTO } from '../auth/auth.mapper.js';

const client = new OAuth2Client(
  config.oauth.google.client_id,
  config.oauth.google.client_secret,
  config.oauth.google.redirect_url,
);

export const verifyGoogleToken = async (codeVerifier: string, code: string) => {
  const { tokens } = await client.getToken({
    code,
    codeVerifier,
  });

  if (!tokens?.id_token) throw new AppError(401, 'Invalid Google token');

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.oauth.google.client_id,
  });

  const payload = ticket.getPayload();

  if (!payload) throw new AppError(401, 'Invalid Google token');
  return payload;
};

export const generateUrlForGoogleOauth = async () => {
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
  const payload = await verifyGoogleToken(codeVerifier, code);

  const userDetails = await findOrCreateUserFromGoogle(payload);
  //create tokens
  const sessionId = crypto.randomUUID(); // create rendom session id
  const { accessToken, refreshToken } = generateSessionTokens(userDetails.user_id, userDetails.role, sessionId);

  const tokenHash = await bcrypt.hash(refreshToken, 10);

  await createSession({
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

  const existingOauth = await findOauthAccount('google', sub);

  let userDetails;

  if (existingOauth) {
    const user = await findUserByid(existingOauth.user_id);
    userDetails = user;
  } else {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      userDetails = existingUser;
    } else {
      const user = await createUser({ name: name || '', email, emailVerified: email_verified });
      if (!user) throw new AppError(500, 'User not created please try again');
      await createOauthAccount(user.user_id, 'google', sub);
      userDetails = user;
    }
  }

  if (!userDetails) throw new AppError(500, 'User not created please try again');
  return userDetails;
};
