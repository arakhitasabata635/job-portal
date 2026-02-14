import { config } from '../../config/env.js';
import { CookieOptions, Request } from 'express';
import { AppError } from '../errors/appError.js';

const isProd = config.node_env === 'production';

export const refreshTokenCookieOption: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const oAuthCookieOption: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/api/oauth/google-callback',
  maxAge: 5 * 60 * 1000,
};

export const clearCookieOption: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
};

export const extractTokenFromCookie = (req: Request, tokenName: string): string => {
  const token = req.cookies?.[tokenName];

  if (!token) {
    throw new AppError(401, `${tokenName} is missing.`);
  }
  return token;
};
