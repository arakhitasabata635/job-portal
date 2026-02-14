import { Request } from 'express';
import { AppError } from '../errors/appError.js';

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
