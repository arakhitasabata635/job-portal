import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errorClass.js";

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
  res.status(statusCode).json({
    success: false,
    message: message,
  });
};
