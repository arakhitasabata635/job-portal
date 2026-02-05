import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  loginUserController,
  refreshAccessTokenController,
  registerUserController,
} from "../controller/auth.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

const router = express.Router();
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(registerUserController),
);
router.post("/login", validate(loginSchema), asyncHandler(loginUserController));
router.post("/refresh", asyncHandler(refreshAccessTokenController));

export default router;
