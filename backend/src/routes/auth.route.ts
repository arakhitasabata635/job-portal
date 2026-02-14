import express from 'express';
import { asyncHandler } from '../shared/middleware/asyncHandler.js';
import * as authController from '../modules/auth/auth.controller.js';
import { validate } from '../shared/middleware/validate.middleware.js';
import { forgotPasswordSchema, loginSchema, registerSchema } from '../modules/auth/auth.schema.js';

const authRouter = express.Router();
authRouter.post('/register', validate(registerSchema), asyncHandler(authController.registerUserController));
authRouter.post('/login', validate(loginSchema), asyncHandler(authController.loginUserController));

authRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotpasswordController),
);

export default authRouter;
