import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {

  console.error(
    "[ERROR]",
    req.method,
    req.originalUrl,
    err.message
  );

  res.status(
    err.status || 500
  ).json({
    success:false,
    message:
      err.message ||
      "Internal Server Error"
  });
}