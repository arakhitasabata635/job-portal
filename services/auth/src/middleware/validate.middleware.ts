import { z, ZodError } from "zod";
import { asyncHandler } from "./asyncHandler.js";
import { AppError } from "../utils/errorClass.js";
import { sendError } from "../utils/response.js";

export const validate = (schema: z.ZodTypeAny) =>
  asyncHandler(async (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      if (result.error instanceof ZodError) {
        const message = "Validation faield";
        const error = result.error.issues.map((err) => ({
          field: err.path,
          message: err.message,
        }));
        return sendError(res, message, error, 400);
      }

      throw new AppError(400, "Validation failed");
    }
    req.body = result.data;
    next();
  });
