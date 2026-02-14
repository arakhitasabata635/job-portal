import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/errors/appError.js';
import { config } from '../../config/env.js';
import { UserRole } from '../../types/role.js';

const accessSecreate = config.jwt.access_token.secret;
const refreshSecret = config.jwt.refresh_token.secret;

interface RefreshPayload {
  userId: string;
  sessionId: string;
}
interface AccessPayload {
  userId: string;
  role: string;
}

const generateAccessToken = (data: AccessPayload) => {
  return jwt.sign(data, accessSecreate, { expiresIn: config.jwt.access_token.expire });
};

const generateRefreshToken = (data: RefreshPayload) => {
  return jwt.sign(data, refreshSecret, { expiresIn: config.jwt.refresh_token.expire });
};

export const generateSessionTokens = (userId: string, role: UserRole, sessionId: string) => {
  const accessToken = generateAccessToken({
    userId: userId,
    role: role,
  });

  const refreshToken = generateRefreshToken({
    userId: userId,
    sessionId,
  });
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): AccessPayload => {
  try {
    return jwt.verify(token, accessSecreate) as AccessPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError(401, 'Access token expired');
    }
    throw new AppError(401, 'Invalid access token');
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, refreshSecret) as RefreshPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError(401, 'Refresh token expired');
    }
    throw new AppError(401, 'Invalid refresh token');
  }
};
