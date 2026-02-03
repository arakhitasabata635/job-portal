import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  loginUserController,
  registerUserController,
} from "../controller/auth.js";

const router = express.Router();
router.post("/register", asyncHandler(registerUserController));
router.post("/register", asyncHandler(loginUserController));

export default router;
