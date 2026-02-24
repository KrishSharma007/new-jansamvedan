import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const payload = (req as any).user as { sub: string; role: string } | undefined;
  if (!payload || payload.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}