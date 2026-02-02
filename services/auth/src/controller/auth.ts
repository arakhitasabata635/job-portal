import { controller } from "../types/controller.js";

export const registerUserController: controller = async (req, res) => {
  const { email, password } = req.body;
  res.json({
    email: email,
    password: password,
  });
};
