import { config } from '../../config/env.js';
import { extractTokenFromCookie } from '../../shared/helpers/cookie.helper.js';
import { sendSuccess } from '../../shared/response/response.js';
import { Controller } from '../../types/controller.js';
import { allLogoutService, refreshSessionService, singleLogoutService } from './session.service.js';

import * as cookie from '../../shared/helpers/cookie.helper.js';
import { extractAccesToken } from '../../shared/helpers/extractHeader.js';

export const rrefreshSessionController: Controller = async (req, res, next) => {
  const oldRefreshToken = extractTokenFromCookie(req, config.jwt.refresh_token.cookie_name);

  const { accessToken, refreshToken } = await refreshSessionService(oldRefreshToken);

  res.cookie(config.jwt.refresh_token.cookie_name, refreshToken, cookie.refreshTokenCookieOption);

  return sendSuccess<{}>(res, { accessToken }, 'token created succefully', 200);
};

export const singleLogoutControler: Controller = async (req, res, next) => {
  const refreshToken = extractTokenFromCookie(req, config.jwt.refresh_token.cookie_name);
  const result = await singleLogoutService(refreshToken);
  res.clearCookie(config.jwt.refresh_token.cookie_name, cookie.clearCookieOption);

  return sendSuccess<{}>(res, {}, 'Logout succefully', 200);
};

export const allLogoutController: Controller = async (req, res, next) => {
  const token = extractAccesToken(req);
  await allLogoutService(token);

  res.clearCookie(config.jwt.refresh_token.cookie_name, cookie.clearCookieOption);

  return sendSuccess<{}>(res, {}, 'Logout from all device is succefull', 200);
};
