import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { authMiddleware } from "./middleware/auth";
import { PrismaClient } from "@prisma/client";
import { reportsRouter } from "./routes/reports";
import { uploadsRouter } from "./routes/uploads";
import helpersRouter from "./routes/helpers";
import { analyticsRouter } from "./routes/analytics";
import { exportRouter } from "./routes/export";

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRouter);
app.use("/uploads", uploadsRouter);
app.use("/reports", reportsRouter);
app.use("/helpers", helpersRouter);
app.use("/analytics", analyticsRouter);
app.use("/export", exportRouter);

// Example protected route
app.get("/profile", authMiddleware, async (req, res) => {
  const userId = (req as any).user?.sub as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Auth server listening on http://localhost:${port}`);
});
