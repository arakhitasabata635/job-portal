import { AppError } from '@/shared/errors/appError.js';
import { GooglePayload } from './oauth.type.js';
import { UserDTO } from '../auth/auth.types.js';
import * as oauthRepo from './oauth.repository.js';
import * as authRepo from '../auth/auth.repository.js';
import { toUserDTO } from '../auth/auth.mapper.js';

/* ======================================
   CREATE GOOGLE USER
====================================== */
export const findOrCreateUserFromGoogle = async (payload: GooglePayload): Promise<UserDTO> => {
  // check token got payload
  const { sub, email, email_verified, name } = payload;

  if (!email || !email_verified) throw new AppError(400, 'A verified email is required.');

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
  const userDTO = toUserDTO(userDetails);
  return userDTO;
};
