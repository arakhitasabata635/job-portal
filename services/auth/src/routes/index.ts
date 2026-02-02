import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { registerUserController } from "../controller/auth.js";

const router = express.Router();
router.post("/register", asyncHandler(registerUserController));

export default router;
