import { z, ZodError } from "zod";
import { asyncHandler } from "./asyncHandler.js";
import { AppError } from "../errors/appError.js";
import { sendError } from "../response/response.js";

export const validate = (schema: z.ZodTypeAny) =>
  asyncHandler(async (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      if (result.error instanceof ZodError) {
        const message = "Validation faield";
        const errors = result.error.issues.map((err) => ({
          field: err.path[0] as string,
          message: err.message,
        }));
        return sendError(res, message, 400, errors);
      }

      throw new AppError(400, "Validation failed");
    }
    req.body = result.data;
    next();
  });
