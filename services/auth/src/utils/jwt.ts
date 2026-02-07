import jwt from "jsonwebtoken";
import { AppError } from "./errorClass.js";

const accessSecreate: string = process.env.JWT_ACCESS_SECRET as string;
const refreshSecret = process.env.JWT_REFRESH_SECRET as string;

interface RefreshPayload {
  id: number;
  session_id: string;
}
interface AccessPayload {
  id: number;
  email: string;
  role: string;
}

export const generateAccessToken = (data: AccessPayload) => {
  return jwt.sign(data, accessSecreate, { expiresIn: "1h" });
};

export const generateRefreshToken = (data: RefreshPayload) => {
  return jwt.sign(data, refreshSecret, { expiresIn: "7h" });
};

export const verifyAccessToken = (token: string): AccessPayload => {
  try {
    return jwt.verify(token, accessSecreate) as AccessPayload;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new AppError(401, "Access token expired");
    }
    throw new AppError(401, "Invalid access token");
  }
};

export const verifyRefreshToken = (token: string): RefreshPayload => {
  try {
    return jwt.verify(token, refreshSecret) as RefreshPayload;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new AppError(401, "Refresh token expired");
    }
    throw new AppError(401, "Invalid refresh token");
  }
};
