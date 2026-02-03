import { resisterUserService } from "../services/authServices.js";
import { controller } from "../types/controller.js";
import { resisterUser } from "../types/user.js";

export const registerUserController: controller = async (req, res) => {
  const { name, email, password, phoneNumber, role }: resisterUser = req.body;

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

export const loginUserController: controller = async (req, res) => {
  const { email, password } = req.body;
};
