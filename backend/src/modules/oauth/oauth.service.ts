import * as sessionService from '../session/session.service.js';
import * as googleProvider from './providers/google.provider.js';
import * as oauthService from './oauth.user.service.js';
import crypto from 'crypto';

export const generateUrlForGoogleOauth = async () => {
  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('hex');

  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const url = googleProvider.makeUrlForGoogleLogin(state, codeChallenge);
  return { url, codeVerifier, state };
};
/* ======================================
   GOOGLE CALLBACK FUNCTION
====================================== */
export const googleCallbackService = async (
  codeVerifier: string,
  code: string,
  deviceInfo: string,
  ipAddress: string | null,
) => {
  const payload = await googleProvider.verifyGoogleToken(codeVerifier, code);

  const userDTO = await oauthService.findOrCreateUserFromGoogle(payload);

  //create tokens
  const { accessToken, refreshToken } = await sessionService.createSessionForUser(userDTO, deviceInfo, ipAddress);
  return { userDTO, accessToken, refreshToken };
};
