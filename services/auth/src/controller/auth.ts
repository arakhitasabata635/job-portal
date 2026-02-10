import {
  createAccessTokenService,
  loginUserService,
  singleLogoutService,
  registerUserService,
  allLogoutService,
  generateGoogleOauthURLService,
} from "../services/authServices.js";
import { controller } from "../types/controller.js";
import { sendSuccess } from "../utils/response.js";
import { UserDTO } from "../types/user.js";
import { AppError } from "../utils/errorClass.js";
import { CookieOptions } from "express";
import { getDeviceInfo, getIp } from "../utils/getApiDetails.js";

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
  const deviceInfo = getDeviceInfo(req);
  const ipAddress = getIp(req);
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

  // res.clearCookie("refreshToken", clearCookieOption);

  const { accessToken, newRefreshToken } =
    await createAccessTokenService(refreshToken);

  res.cookie("refreshToken", newRefreshToken, cookieOption);
  return sendSuccess<{}>(res, { accessToken }, "token created succefully", 200);
};

export const singleLogoutControler: controller = async (req, res, next) => {
  const refreshToken: string | undefined = req.cookies["refreshToken"];
  if (!refreshToken) throw new AppError(204, "User is already logout");

  const result = await singleLogoutService(refreshToken);
  if (!result)
    throw new AppError(
      500,
      "Logout failed due to a server error. Please try again or clear your browser cookies.",
    );

  res.clearCookie("refreshToken", clearCookieOption);

  return sendSuccess<{}>(res, {}, "Logout succefully", 204);
};

export const allLogoutController: controller = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError(401, "Authorization header missing");
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new AppError(401, "Access token missing");
  }
  const result = await allLogoutService(token);
  if (!result)
    throw new AppError(
      500,
      "Logout failed due to a server error. Please try again.",
    );

  res.clearCookie("refreshToken", clearCookieOption);

  return sendSuccess<{}>(res, {}, "Logout from all device is succefull", 204);
};

export const generateGoogleOauthURL: controller = async (req, res, next) => {
  const { url, codeVerifier, state } = await generateGoogleOauthURLService();
  res.cookie("pkce_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
  });
  res.cookie("google_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
  });
  return sendSuccess<{}>(
    res,
    { url },
    "Authorization URL generated successfully",
    301,
  );
};
