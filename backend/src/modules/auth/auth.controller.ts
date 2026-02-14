import { config } from '../../config/env.js';

//services
import * as authService from './auth.service.js';

//types
import { Controller } from '../../types/controller.js';
import { UserDTO } from './auth.types.js';

//functions
import { sendSuccess } from '../../shared/response/response.js';
import { getDeviceInfo, getIp } from '../../shared/helpers/device.helper.js';
import * as cookie from '../../shared/helpers/cookie.helper.js';

//cookies

export const registerUserController: Controller = async (req, res, next) => {
  let createdUser = await authService.registerUserService(req.body);
  return sendSuccess<UserDTO>(res, createdUser, 'user created successfully', 200);
};

export const loginUserController: Controller = async (req, res, next) => {
  const deviceInfo = getDeviceInfo(req);
  const ipAddress = getIp(req);

  const { userDTO, accessToken, refreshToken } = await authService.loginUserService(req.body, deviceInfo, ipAddress);

  res.cookie(config.jwt.refresh_token.cookie_name, refreshToken, cookie.refreshTokenCookieOption);

  return sendSuccess<{}>(res, { userDTO, accessToken }, 'user Login successfully', 200);
};

export const forgotpasswordController: Controller = async (req, res, next) => {
  authService.forgotPasswordService(req.body);
  return sendSuccess<{}>(res, {}, 'If an account exists with that email, a password reset link has been sent.', 200);
};

export const resetPasswordController: Controller = async (req, res, next) => {
  await authService.resetPasswordService(req.body);
};
