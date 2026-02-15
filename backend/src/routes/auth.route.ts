import express from 'express';
import { asyncHandler } from '../shared/middleware/asyncHandler.js';
import * as authController from '../modules/auth/auth.controller.js';
import { validate } from '../shared/middleware/validate.middleware.js';
import {
  emailVerifySchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../modules/auth/auth.schema.js';

const authRouter = express.Router();
authRouter.post('/register', validate(registerSchema), asyncHandler(authController.registerUserController));
authRouter.post('/login', validate(loginSchema), asyncHandler(authController.loginUserController));

authRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotpasswordController),
);
authRouter.post('/reset-password', validate(resetPasswordSchema), asyncHandler(authController.resetPasswordController));

authRouter.post('/verify-email', validate(emailVerifySchema), asyncHandler(authController.emailVerifyControler));

export default authRouter;
