import express from 'express';
import { asyncHandler } from '../shared/middleware/asyncHandler.js';
import * as authController from '../modules/auth/auth.controller.js';
import { validate } from '../shared/middleware/validate.middleware.js';
import { loginSchema, registerSchema } from '../modules/auth/auth.schema.js';

const router = express.Router();
router.post('/register', validate(registerSchema), asyncHandler(authController.registerUserController));
router.post('/login', validate(loginSchema), asyncHandler(authController.loginUserController));
router.post('/logout', asyncHandler(authController.singleLogoutControler));
router.post('/refresh', asyncHandler(authController.refreshAccessTokenController));
router.post('/logout-all', asyncHandler(authController.allLogoutController));

router.get('/google', asyncHandler(authController.generateGoogleOauthURL));
router.get('/google-callback', asyncHandler(authController.googleCallbackController));

export default router;
