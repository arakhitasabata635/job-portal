import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';

//services
import {
  createAccessTokenService,
  loginUserService,
  singleLogoutService,
  registerUserService,
  allLogoutService,
  googleCallbackService,
} from './auth.service.js';

//types
import { Controller } from '../../types/controller.js';
import { UserDTO } from './auth.types.js';

//functions
import { sendSuccess } from '../../shared/response/response.js';
import { generateUrlForGoogleOauth } from '../oauth/google.service.js';
import { getDeviceInfo, getIp } from '../../shared/helpers/device.helper.js';

//cookies
import * as cookieOptions from './auth.cookies.js';
import { extractAccesToken, extractTokenFromCookie } from '../../shared/helpers/auth.token.helper.js';

export const registerUserController: Controller = async (req, res, next) => {
  let createdUser = await registerUserService(req.body);
  return sendSuccess<UserDTO>(res, createdUser, 'user created successfully', 200);
};

export const loginUserController: Controller = async (req, res, next) => {
  if (req.cookies[config.jwt.refresh_token.cookie_name])
    res.clearCookie(config.jwt.refresh_token.cookie_name, cookieOptions.clearCookieOption);

  const deviceInfo = getDeviceInfo(req);
  const ipAddress = getIp(req);

  const { userDTO, accessToken, refreshToken } = await loginUserService(req.body, { deviceInfo, ipAddress });

  res.cookie(config.jwt.refresh_token.cookie_name, refreshToken, cookieOptions.cookieOption);

  return sendSuccess<{}>(res, { userDTO, accessToken }, 'user Login successfully', 200);
};

export const refreshAccessTokenController: Controller = async (req, res, next) => {
  const refreshToken = extractTokenFromCookie(req, config.jwt.refresh_token.cookie_name);

  const { accessToken, newRefreshToken } = await createAccessTokenService(refreshToken);

  res.cookie(config.jwt.refresh_token.cookie_name, newRefreshToken, cookieOptions.cookieOption);

  return sendSuccess<{}>(res, { accessToken }, 'token created succefully', 200);
};

export const singleLogoutControler: Controller = async (req, res, next) => {
  const refreshToken = extractTokenFromCookie(req, config.jwt.refresh_token.cookie_name);

  const result = await singleLogoutService(refreshToken);
  res.clearCookie(config.jwt.refresh_token.cookie_name, cookieOptions.clearCookieOption);

  return sendSuccess<{}>(res, {}, 'Logout succefully', 200);
};

export const allLogoutController: Controller = async (req, res, next) => {
  const token = extractAccesToken(req);
  const result = await allLogoutService(token);

  res.clearCookie(config.jwt.refresh_token.cookie_name, cookieOptions.clearCookieOption);

  return sendSuccess<{}>(res, {}, 'Logout from all device is succefull', 204);
};

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
