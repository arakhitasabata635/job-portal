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
  data: UserDTO;
  accessToken: string;
};
const cookieOption: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
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
    res.clearCookie("refreshToken", cookieOption);
  const { userDTO, accessToken, refreshToken } = await loginUserService(
    req.body,
  );
  res.cookie("refreshToken", refreshToken, cookieOption);

  return sendSuccess<LoginRes>(
    res,
    { data: userDTO, accessToken },
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
  res.clearCookie("refreshToken", cookieOption);
  const { accessToken, newRefreshToken } =
    await createAccessTokenService(refreshToken);
  res.cookie("refreshToken", newRefreshToken, cookieOption);
  return sendSuccess<{}>(res, { accessToken }, "token created succefully", 200);
};

export const logoutControler: controller = async (req, res, next) => {
  const refreshToken: string | undefined = req.cookies["refreshToken"];
  if (!refreshToken) throw new AppError(204, "User is already logout");
  const result = await logoutService(refreshToken);
  res.clearCookie("refreshToken", cookieOption);
  return sendSuccess<{}>(res, {}, "Logout succefully", 204);
};
