import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/appError.js";
import { sendError } from "../response/response.js";

export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let message = "Internal server error";
  let statusCode = 500;
  console.log(error);
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // only for dev
  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      success: false,
      message: error.message,
      stack: error.stack,
    });
  }
  return sendError(res, message, statusCode);
};
