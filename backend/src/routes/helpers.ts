import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Add or remove NGO helper for a complaint
router.post("/:complaintId/help", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { complaintId } = req.params;
    const { action } = req.body; // "add" or "remove"
    const userId = (req as any).user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get the NGO user from User table
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== "NGO") {
      return res.status(403).json({ error: "Only NGO users can help with complaints" });
    }

    // Check if complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId }
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (action === "add") {
      // Add helper (upsert to handle duplicates)
      const helper = await prisma.complaintHelper.upsert({
        where: {
          complaintId_userId: {
            complaintId,
            userId: userId
          }
        },
        update: {
          status: "HELPING",
          updatedAt: new Date()
        },
        create: {
          complaintId,
          userId: user.id,
          status: "HELPING"
        }
      });

      res.json({ 
        success: true, 
        message: "Successfully added as helper",
        helper 
      });
    } else if (action === "remove") {
      // Remove helper
      await prisma.complaintHelper.deleteMany({
        where: {
          complaintId,
          userId: user.id
        }
      });

      res.json({ 
        success: true, 
        message: "Successfully removed as helper" 
      });
    } else {
      res.status(400).json({ error: "Invalid action. Use 'add' or 'remove'" });
    }
  } catch (error) {
    console.error("Error managing helper:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all helpers for a specific complaint (Admin only)
router.get("/:complaintId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { complaintId } = req.params;
    const userId = (req as any).user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can view helpers" });
    }

    // Get all helpers for the complaint
    const helpers = await prisma.complaintHelper.findMany({
      where: { complaintId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            organization: true,
            serviceArea: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(helpers);
  } catch (error) {
    console.error("Error fetching helpers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all complaints that an NGO is helping with
router.get("/ngo/my-helping", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get the NGO user from User table
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== "NGO") {
      return res.status(403).json({ error: "Only NGO users can access this endpoint" });
    }

    // Get all complaints the NGO is helping with
    const helpingComplaints = await prisma.complaintHelper.findMany({
      where: { userId: user.id },
      include: {
        complaint: {
          select: {
            id: true,
            complaintId: true,
            title: true,
            description: true,
            category: true,
            priority: true,
            status: true,
            address: true,
            latitude: true,
            longitude: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(helpingComplaints);
  } catch (error) {
    console.error("Error fetching NGO helping complaints:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update helper status (Admin only)
router.patch("/:helperId/status", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { helperId } = req.params;
    const { status } = req.body; // "HELPING", "CONTACTED", "DECLINED"
    const userId = (req as any).user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can update helper status" });
    }

    // Update helper status
    const helper = await prisma.complaintHelper.update({
      where: { id: helperId },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            organization: true
          }
        }
      }
    });

    res.json({ 
      success: true, 
      message: "Helper status updated successfully",
      helper 
    });
  } catch (error) {
    console.error("Error updating helper status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
