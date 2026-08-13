import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";

const prisma = new PrismaClient();
export const notificationsRouter = Router();

export async function sendNotification({
  userId,
  complaintId,
  title,
  message,
}: {
  userId: string;
  complaintId?: string;
  title: string;
  message: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        complaintId: complaintId || null,
        title,
        message,
      },
    });

    // Simulated email / push notification log
    console.log(
      `📧 [EMAIL DISPATCH] Sent to User ID (${userId}) -> "${title}": ${message}`
    );

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// Get user notifications
notificationsRouter.get("/me", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.sub;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        complaint: {
          select: {
            id: true,
            complaintId: true,
            title: true,
            status: true,
          },
        },
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Mark single notification read
notificationsRouter.patch("/:id/read", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Mark all notifications read
notificationsRouter.patch("/read-all", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.sub;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
