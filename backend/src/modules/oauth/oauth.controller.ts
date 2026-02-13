import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';

//services

//types
import { Controller } from '../../types/controller.js';

//functions
import { sendSuccess } from '../../shared/response/response.js';
import { getDeviceInfo, getIp } from '../../shared/helpers/device.helper.js';

//cookies
import * as cookieOptions from '../auth/auth.cookies.js';
import { extractTokenFromCookie } from '../../shared/helpers/auth.token.helper.js';
import { generateUrlForGoogleOauth, googleCallbackService } from './google.service.js';

export const generateGoogleOauthURL: Controller = async (req, res, next) => {
  const { url, codeVerifier, state } = await generateUrlForGoogleOauth();

  res.cookie('pkce_verifier', codeVerifier, cookieOptions.oAuthCookieOption);
  res.cookie('google_state', state, cookieOptions.oAuthCookieOption);

  res.redirect(url);
};

export const googleCallbackController: Controller = async (req, res, next) => {
  const { state, code } = req.query;

  const codeVerifier = extractTokenFromCookie(req, 'pkce_verifier');
  const google_state = extractTokenFromCookie(req, 'google_state');

  if (!(state && code && state === google_state)) throw new AppError(404, 'invalid session please try again');

  const deviceInfo = getDeviceInfo(req);
  const ipAddress = getIp(req);

  const { userDTO, accessToken, refreshToken } = await googleCallbackService(codeVerifier, code as string, {
    deviceInfo,
    ipAddress,
  });

  res.cookie(config.jwt.refresh_token.cookie_name, refreshToken, cookieOptions.cookieOption);
  return sendSuccess<{}>(res, { user: userDTO, accessToken }, 'user Login successfully', 200);
};
