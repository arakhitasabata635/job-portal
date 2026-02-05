import { success } from "zod";
import {
  loginUserService,
  registerUserService,
} from "../services/authServices.js";
import { controller } from "../types/controller.js";

export const registerUserController: controller = async (req, res, next) => {
  let createdUser = await registerUserService(req.body);

  res.status(201).json({
    success: true,
    message: "user created successfully",
    data: createdUser,
  });
};

export const loginUserController: controller = async (req, res, next) => {
  const { userDTO, accessToken, refreshToken } = await loginUserService(
    req.body,
  );

  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({
      success: true,
      data: {
        userDTO,
        accessToken,
      },
      message: "login successfully",
    });
};

export const refreshAccessTokenController: controller = async (
  req,
  res,
  next,
) => {
  console.log(req.cookies);
};
