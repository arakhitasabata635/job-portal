import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';

//services
import { loginUserService, registerUserService } from './auth.service.js';

//types
import { Controller } from '../../types/controller.js';
import { UserDTO } from './auth.types.js';

//functions
import { sendSuccess } from '../../shared/response/response.js';
import { getDeviceInfo, getIp } from '../../shared/helpers/device.helper.js';

//cookies
import * as cookieOptions from './auth.cookies.js';

export const registerUserController: Controller = async (req, res, next) => {
  let createdUser = await registerUserService(req.body);
  return sendSuccess<UserDTO>(res, createdUser, 'user created successfully', 200);
};

export const loginUserController: Controller = async (req, res, next) => {
  if (req.cookies[config.jwt.refresh_token.cookie_name])
    res.clearCookie(config.jwt.refresh_token.cookie_name, cookieOptions.clearCookieOption);

  const deviceInfo = getDeviceInfo(req);
  const ipAddress = getIp(req);

  const { userDTO, accessToken, refreshToken } = await loginUserService(req.body, deviceInfo, ipAddress);

  res.cookie(config.jwt.refresh_token.cookie_name, refreshToken, cookieOptions.cookieOption);

  return sendSuccess<{}>(res, { userDTO, accessToken }, 'user Login successfully', 200);
};
