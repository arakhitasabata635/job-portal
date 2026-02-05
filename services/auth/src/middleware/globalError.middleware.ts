import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errorClass.js";
import { sendError } from "../utils/response.js";

export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let message = "Internal server error";
  let statusCode = 500;
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  return sendError(res, message, statusCode);
};
