import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  loginUserController,
  registerUserController,
} from "../controller/auth.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerSchema } from "../schemas/auth.schema.js";

const router = express.Router();
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(registerUserController),
);
router.post("/register", asyncHandler(loginUserController));

export default router;
