import { RequestHandler } from "express";
import { controller } from "../types/controller.js";

export const asyncHandler =
  (controller: controller): RequestHandler =>
  async (req, res, next) => {
    try {
      const result = await controller(req, res, next);
    } catch (error: any) {
      next(error);
    }
  };
