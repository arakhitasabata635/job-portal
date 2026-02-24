import { Router } from 'express';
import * as sessionController from '../modules/session/session.controller.js';
import { asyncHandler } from '../shared/middleware/asyncHandler.js';

const sessionRoute = Router();

sessionRoute.post('/logout', asyncHandler(sessionController.singleLogoutControler));
sessionRoute.post('/refresh', asyncHandler(sessionController.refreshSessionController));
sessionRoute.post('/logout-all', asyncHandler(sessionController.allLogoutController));

export default sessionRoute;
