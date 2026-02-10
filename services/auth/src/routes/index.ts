import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  loginUserController,
  singleLogoutControler,
  refreshAccessTokenController,
  registerUserController,
  allLogoutController,
  generateGoogleOauthURL,
  googleCallbackController,
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
router.post("/logout", asyncHandler(singleLogoutControler));
router.post("/refresh", asyncHandler(refreshAccessTokenController));
router.post("/logout-all", asyncHandler(allLogoutController));

router.get("/google", asyncHandler(generateGoogleOauthURL));
router.get("/google-callback", asyncHandler(googleCallbackController));

export default router;
