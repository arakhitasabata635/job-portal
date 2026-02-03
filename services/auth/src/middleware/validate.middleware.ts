import z from "zod";
import { asyncHandler } from "./asyncHandler.js";
import { AppError } from "../utils/errorClass.js";

export const validate = (schema: z.ZodTypeAny) =>
  asyncHandler(async (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, result.error.message || "Validation failed");
    }
    req.body = result.data;
    next();
  });
