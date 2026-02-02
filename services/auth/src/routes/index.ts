import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { registerUserController } from "../controller/auth.js";
import uploadFile from "../middleware/multer.js";

const router = express.Router();
router.post("/register", uploadFile, asyncHandler(registerUserController));

export default router;
