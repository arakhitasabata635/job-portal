import express from 'express';
import { asyncHandler } from '../shared/middleware/asyncHandler.js';
import {
  loginUserController,
  singleLogoutControler,
  refreshAccessTokenController,
  registerUserController,
  allLogoutController,
  generateGoogleOauthURL,
  googleCallbackController,
} from '../modules/auth/auth.controller.js';
import { validate } from '../shared/middleware/validate.middleware.js';
import { loginSchema, registerSchema } from '../modules/auth/auth.schema.js';

const router = express.Router();
router.post('/register', validate(registerSchema), asyncHandler(registerUserController));
router.post('/login', validate(loginSchema), asyncHandler(loginUserController));
router.post('/logout', asyncHandler(singleLogoutControler));
router.post('/refresh', asyncHandler(refreshAccessTokenController));
router.post('/logout-all', asyncHandler(allLogoutController));

router.get('/google', asyncHandler(generateGoogleOauthURL));
router.get('/google-callback', asyncHandler(googleCallbackController));

export default router;
