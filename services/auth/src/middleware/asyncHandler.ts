import { Request, Response, NextFunction, RequestHandler } from "express";
import { controller } from "../types/controller.js";

export const asyncHandler =
  (controller: controller): RequestHandler =>
  async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error: any) {
      next(error);
    }
  };
