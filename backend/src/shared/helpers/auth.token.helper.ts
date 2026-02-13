import { Request } from 'express';
import { AppError } from '../errors/appError.js';
import { UserRole } from '../../types/role.js';
import { generateAccessToken, generateRefreshToken } from '../../modules/auth/auth.token.js';

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

export const extractTokenFromCookie = (req: Request, tokenName: string): string => {
  const token = req.cookies?.[tokenName];

  if (!token) {
    throw new AppError(401, `${tokenName} is missing.`);
  }

  return token;
};

export const extractAccesToken = (req: Request): string => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError(401, 'Authorization header missing');
  }
  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new AppError(401, 'Access token missing');
  }
  return token;
};
