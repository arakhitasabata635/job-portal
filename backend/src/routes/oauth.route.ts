import { Router } from 'express';
import * as oauthControler from '../modules/oauth/oauth.controller.js';
import { asyncHandler } from '../shared/middleware/asyncHandler.js';

const oauthRouter = Router();
oauthRouter.get('/google', asyncHandler(oauthControler.generateGoogleOauthURL));
oauthRouter.get('/google-callback', asyncHandler(oauthControler.googleCallbackController));

export default oauthRouter;
