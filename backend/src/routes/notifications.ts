import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";

const prisma = new PrismaClient();
export const notificationsRouter = Router();

// Get all notifications for current user
notificationsRouter.get(["/", "/me"], authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        complaint: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Mark single notification as read
notificationsRouter.patch("/:id/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const updated = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    return res.json({ success: true, updatedCount: updated.count });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return res.status(500).json({ error: "Internal server error text" });
  }
});

// Mark all notifications as read
notificationsRouter.patch("/read-all", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const updated = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({ success: true, updatedCount: updated.count });
  } catch (error) {
    console.error("Error marking all read:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
