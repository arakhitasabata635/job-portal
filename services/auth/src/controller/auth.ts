import { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import {
  loginUserService,
  resisterUserService,
} from "../services/authServices.js";
import { controller } from "../types/controller.js";

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
    message: "user created successfully",
    data: createdUser,
  });
};

export const loginUserController: controller = async (req, res, next) => {
  const data: LoginInput = req.body;
  const loginUser = await loginUserService(data);
  res.status(200).json({ data: loginUser, message: "login successfully" });
};
