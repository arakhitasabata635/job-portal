import { CookieOptions } from 'express';
import { config } from '../../config/env.js';

const isProd = config.node_env === 'production';

export const cookieOption: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
export const clearCookieOption: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
};

export const oAuthCookieOption: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/api/auth/google-callback',
  maxAge: 5 * 60 * 1000,
};
