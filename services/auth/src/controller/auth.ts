import {
  loginUserService,
  registerUserService,
} from "../services/authServices.js";
import { controller } from "../types/controller.js";
import { sendSuccess } from "../utils/response.js";
import { UserDTO } from "../types/user.js";

type LoginRes = {
  data: UserDTO;
  accessToken: string;
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
  const { userDTO, accessToken, refreshToken } = await loginUserService(
    req.body,
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return sendSuccess<LoginRes>(
    res,
    { data: userDTO, accessToken },
    "user created successfully",
    200,
  );
};

export const refreshAccessTokenController: controller = async (
  req,
  res,
  next,
) => {
  console.log(req.cookies);
};
