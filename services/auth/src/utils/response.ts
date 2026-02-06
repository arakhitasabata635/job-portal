import { Response } from "express";
import { ApiResponse } from "../types/apiResponse.js";

export const sendSuccess = <T>(
  res: Response<ApiResponse<T>>,
  data: T,
  message: string,
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response<ApiResponse<null>>,
  message: string,
  statusCode = 500,
  error?: unknown,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};
