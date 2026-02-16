import { RequestHandler } from 'express';
import { Controller } from '../../types/controller.js';

export const asyncHandler =
  (controller: Controller): RequestHandler =>
  async (req, res, next) => {
    try {
      const result = await controller(req, res, next);
    } catch (error: any) {
      next(error);
    }
  };
