import { CodeChallengeMethod, OAuth2Client, TokenPayload } from 'google-auth-library';
import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';

import crypto from 'crypto';
import { UserEntity } from '../auth/auth.types.js';
import { createOauthAccount, findOauthAccount } from './oauth.repository.js';
import { createUser, findUserByEmail, findUserByid } from '../auth/auth.repository.js';

import { toUserDTO } from '../auth/auth.mapper.js';
import * as sessionService from '../session/session.service.js';
import { verifyGoogleToken } from './providers/google.provider.js';

export const googleCallbackService = async (
  codeVerifier: string,
  code: string,
  deviceInfo: string,
  ipAddress: string | null,
) => {
  const payload = await verifyGoogleToken(codeVerifier, code);

  const userDetails = await findOrCreateUserFromGoogle(payload);

  const userDTO = toUserDTO(userDetails);
  //create tokens
  const { accessToken, refreshToken } = await sessionService.createSessionForUser(userDTO, deviceInfo, ipAddress);
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
