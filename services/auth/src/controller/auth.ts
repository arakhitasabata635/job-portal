import {
  createAccessTokenService,
  loginUserService,
  logoutService,
  registerUserService,
} from "../services/authServices.js";
import { controller } from "../types/controller.js";
import { sendSuccess } from "../utils/response.js";
import { UserDTO } from "../types/user.js";
import { AppError } from "../utils/errorClass.js";
import { CookieOptions } from "express";

type LoginRes = {
  user: UserDTO;
  accessToken: string;
};
const cookieOption: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const clearCookieOption: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};
export const registerUserController: controller = async (req, res, next) => {
  let createdUser = await registerUserService(req.body);
  return sendSuccess<UserDTO>(
    res,
    createdUser,
    "user created successfully",
    200,
  );
};

export const loginUserController: controller = async (req, res, next) => {
  if (req.cookies["refreshToken"])
    res.clearCookie("refreshToken", clearCookieOption);
  const deviceInfo = req.headers["user-agent"] ?? "unknown";
  const ipAddress = req.ip || "";
  const { userDTO, accessToken, refreshToken } = await loginUserService(
    req.body,
    { deviceInfo, ipAddress },
  );

  res.cookie("refreshToken", refreshToken, cookieOption);
  return sendSuccess<LoginRes>(
    res,
    { user: userDTO, accessToken },
    "user Login successfully",
    200,
  );
};

export const refreshAccessTokenController: controller = async (
  req,
  res,
  next,
) => {
  const refreshToken: string | undefined = req.cookies["refreshToken"];

  if (!refreshToken)
    throw new AppError(400, "Refresh token is missing or null.");

  res.clearCookie("refreshToken", clearCookieOption);

  const { accessToken, newRefreshToken } =
    await createAccessTokenService(refreshToken);

  res.cookie("refreshToken", newRefreshToken, cookieOption);
  return sendSuccess<{}>(res, { accessToken }, "token created succefully", 200);
};

export const logoutControler: controller = async (req, res, next) => {
  const refreshToken: string | undefined = req.cookies["refreshToken"];
  if (!refreshToken) throw new AppError(204, "User is already logout");

  const result = await logoutService(refreshToken);
  if (!result)
    throw new AppError(
      500,
      "Logout failed due to a server error. Please try again or clear your browser cookies.",
    );

  res.clearCookie("refreshToken", clearCookieOption);

  return sendSuccess<{}>(res, {}, "Logout succefully", 204);
};
