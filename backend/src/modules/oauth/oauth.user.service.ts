import { AppError } from '@/shared/errors/appError.js';
import { GooglePayload } from './oauth.type.js';
import { UserDTO } from '../auth/auth.types.js';
import * as oauthRepo from './oauth.repository.js';
import * as authRepo from '../auth/auth.repository.js';
import * as authMaper from '../auth/auth.mapper.js';

/* ======================================
   CREATE GOOGLE USER
====================================== */
export const findOrCreateUserFromGoogle = async (payload: GooglePayload): Promise<UserDTO> => {
  if (!payload.email || !payload.email_verified) throw new AppError(400, 'A verified email is required.');

  const existingOauth = await oauthRepo.findOauthAccount('google', payload.sub);

  let userDetails;

  if (existingOauth) {
    const user = await authRepo.findUserByid(existingOauth.user_id);
    userDetails = user;
  } else {
    const existingUser = await authRepo.findUserByEmail(payload.email);

    if (existingUser) {
      await oauthRepo.createOauthAccount(existingUser.user_id, 'google', payload.sub);
      userDetails = existingUser;
    } else {
      const user = await authRepo.createUser({
        name: payload.name || '',
        email: payload.email,
        emailVerified: payload.email_verified,
      });
      if (!user) throw new AppError(500, 'User not created please try again');
      await oauthRepo.createOauthAccount(user.user_id, 'google', payload.sub);
      userDetails = user;
    }
  }

  if (!userDetails) throw new AppError(500, 'User not created please try again');
  const userDTO = authMaper.toUserDTO(userDetails);
  return userDTO;
};
