import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring("Bearer ".length);
  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }

  (req as any).user = payload;
  next();
}
