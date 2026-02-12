import {
  createAccessTokenService,
  loginUserService,
  singleLogoutService,
  registerUserService,
  allLogoutService,
  generateGoogleOauthURLService,
  googleCallbackService,
} from './auth.service.js';
import { controller } from '../../types/controller.js';
import { AppError } from '../../shared/errors/appError.js';
import { sendSuccess } from '../../shared/response/response.js';
import { getDeviceInfo, getIp } from '../../shared/helpers/device.helper.js';
import * as cookieOptions from './auth.cookies.js';
import { extractRefreshToken } from '../../shared/helpers/auth.token.helper.js';
import { LoginResponse, UserDTO } from './auth.types.js';

export const registerUserController: controller = async (req, res, next) => {
  let createdUser = await registerUserService(req.body);
  return sendSuccess<UserDTO>(res, createdUser, 'user created successfully', 200);
};

export const loginUserController: controller = async (req, res, next) => {
  if (req.cookies['refreshToken']) res.clearCookie('refreshToken', cookieOptions.clearCookieOption);
  const deviceInfo = getDeviceInfo(req);
  const ipAddress = getIp(req);
  const { userDTO, accessToken, refreshToken } = await loginUserService(req.body, { deviceInfo, ipAddress });

  res.cookie('refreshToken', refreshToken, cookieOptions.cookieOption);
  return sendSuccess<LoginResponse>(res, { user: userDTO, accessToken }, 'user Login successfully', 200);
};

export const refreshAccessTokenController: controller = async (req, res, next) => {
  const refreshToken = extractRefreshToken(req);

  // res.clearCookie("refreshToken", clearCookieOption);

  const { accessToken, newRefreshToken } = await createAccessTokenService(refreshToken);

  res.cookie('refreshToken', newRefreshToken, cookieOptions.cookieOption);
  return sendSuccess<{}>(res, { accessToken }, 'token created succefully', 200);
};

export const singleLogoutControler: controller = async (req, res, next) => {
  const refreshToken: string | undefined = req.cookies['refreshToken'];
  if (!refreshToken) throw new AppError(204, 'User is already logout');

  const result = await singleLogoutService(refreshToken);
  if (!result)
    throw new AppError(500, 'Logout failed due to a server error. Please try again or clear your browser cookies.');

  res.clearCookie('refreshToken', cookieOptions.clearCookieOption);

  return sendSuccess<{}>(res, {}, 'Logout succefully', 204);
};

export const allLogoutController: controller = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError(401, 'Authorization header missing');
  }
  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new AppError(401, 'Access token missing');
  }
  const result = await allLogoutService(token);
  if (!result) throw new AppError(500, 'Logout failed due to a server error. Please try again.');

  res.clearCookie('refreshToken', cookieOptions.clearCookieOption);

  return sendSuccess<{}>(res, {}, 'Logout from all device is succefull', 204);
};

export const generateGoogleOauthURL: controller = async (req, res, next) => {
  const { url, codeVerifier, state } = await generateGoogleOauthURLService();
  res.cookie('pkce_verifier', codeVerifier, cookieOptions.oAuthCookieOption);

  res.cookie('google_state', state, cookieOptions.oAuthCookieOption);
  res.redirect(url);
};

export const googleCallbackController: controller = async (req, res, next) => {
  const { state, code } = req.query;
  const codeVerifier = req.cookies['pkce_verifier'] as string;
  const google_state = req.cookies['google_state'] as string;
  console.log('codeVerifier', codeVerifier);
  console.log('google_state', google_state);
  if (!(state && code && codeVerifier && google_state && state === google_state))
    throw new AppError(404, 'invalid session please try again');

  const deviceInfo = getDeviceInfo(req);
  const ipAddress = getIp(req);

  const { userDTO, accessToken, refreshToken } = await googleCallbackService(codeVerifier, code as string, {
    deviceInfo,
    ipAddress,
  });
  res.cookie('refreshToken', refreshToken, cookieOptions.cookieOption);
  return sendSuccess<LoginRes>(res, { user: userDTO, accessToken }, 'user Login successfully', 200);
};
