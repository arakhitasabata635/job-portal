import { Request } from "express";
import { AppError } from "../errors/appError.js";

export const extractRefreshToken = (req: Request) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError(400, "Refresh token is missing or null.");
  return token;
};
