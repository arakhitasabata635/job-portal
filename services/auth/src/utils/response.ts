import { Response } from "express";
import { ApiResponse } from "../types/response.js";

export const sendSuccess = <T>(
  res: Response<ApiResponse<T>>,
  data: T,
  message = "Success",
  status = 200,
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  status = 400,
  error?: any,
) => {
  return res.status(status).json({
    success: false,
    message,
  });
};
