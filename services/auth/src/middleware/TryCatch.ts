import { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "../utils/errorClass.js";

export const TryCatch =
  (
    controller: (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => Promise<any>,
  ): RequestHandler =>
  async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error: any) {
     next(error)
    }
  };
