import { NextFunction, Request, Response } from "express";

export type controller = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;
