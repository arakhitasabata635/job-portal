import { success } from "zod";
import { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import {
  loginUserService,
  resisterUserService,
} from "../services/authServices.js";
import { controller } from "../types/controller.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

export const registerUserController: controller = async (req, res, next) => {
  const { name, email, password, phoneNumber, role }: RegisterInput = req.body;

  let createdUser = await resisterUserService({
    name,
    email,
    password,
    phoneNumber,
    role,
  });

  res.status(201).json({
    success: true,
    message: "user created successfully",
    data: createdUser,
  });
};

export const loginUserController: controller = async (req, res, next) => {
  const data: LoginInput = req.body;
  const loginUser = await loginUserService(data);

  const accessToken = generateAccessToken(loginUser.user_id, loginUser.role);
  const refreshToken = generateRefreshToken(loginUser.user_id);
  delete loginUser.password;

  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({ data: { loginUser, accessToken }, message: "login successfully" });
};
