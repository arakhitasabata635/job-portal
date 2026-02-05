import { z, ZodError } from "zod";
import { asyncHandler } from "./asyncHandler.js";
import { AppError } from "../utils/errorClass.js";

export const validate = (schema: z.ZodTypeAny) =>
  asyncHandler(async (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      if (result.error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: result.error.issues.map((err) => ({
            field: err.path,
            message: err.message,
          })),
        });
      }
      throw new AppError(400, "Validation failed");
    }
    req.body = result.data;
    next();
  });
