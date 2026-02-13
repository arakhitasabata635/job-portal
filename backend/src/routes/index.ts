import express from 'express';
import { asyncHandler } from '../shared/middleware/asyncHandler.js';
import * as auth from '../modules/auth/auth.controller.js';
import { validate } from '../shared/middleware/validate.middleware.js';
import { loginSchema, registerSchema } from '../modules/auth/auth.schema.js';

const router = express.Router();
router.post('/register', validate(registerSchema), asyncHandler(auth.registerUserController));
router.post('/login', validate(loginSchema), asyncHandler(auth.loginUserController));
router.post('/logout', asyncHandler(auth.singleLogoutControler));
router.post('/refresh', asyncHandler(auth.refreshAccessTokenController));
router.post('/logout-all', asyncHandler(auth.allLogoutController));

router.get('/google', asyncHandler(auth.generateGoogleOauthURL));
router.get('/google-callback', asyncHandler(auth.googleCallbackController));

export default router;
