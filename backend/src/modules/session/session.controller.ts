import { config } from '../../config/env.js';
import { extractAccesToken, extractTokenFromCookie } from '../../shared/helpers/auth.token.helper.js';
import { sendSuccess } from '../../shared/response/response.js';
import { Controller } from '../../types/controller.js';
import { allLogoutService, refreshSessionService, singleLogoutService } from './session.service.js';

import * as authCookieOptions from '../auth/auth.cookies.js';

export const rrefreshSessionController: Controller = async (req, res, next) => {
  const refreshToken = extractTokenFromCookie(req, config.jwt.refresh_token.cookie_name);

  const { accessToken, newRefreshToken } = await refreshSessionService(refreshToken);

  res.cookie(config.jwt.refresh_token.cookie_name, newRefreshToken, authCookieOptions.cookieOption);

  return sendSuccess<{}>(res, { accessToken }, 'token created succefully', 200);
};

export const singleLogoutControler: Controller = async (req, res, next) => {
  const refreshToken = extractTokenFromCookie(req, config.jwt.refresh_token.cookie_name);

  const result = await singleLogoutService(refreshToken);
  res.clearCookie(config.jwt.refresh_token.cookie_name, authCookieOptions.clearCookieOption);

  return sendSuccess<{}>(res, {}, 'Logout succefully', 200);
};

export const allLogoutController: Controller = async (req, res, next) => {
  const token = extractAccesToken(req);
  const result = await allLogoutService(token);

  res.clearCookie(config.jwt.refresh_token.cookie_name, authCookieOptions.clearCookieOption);

  return sendSuccess<{}>(res, {}, 'Logout from all device is succefull', 204);
};
