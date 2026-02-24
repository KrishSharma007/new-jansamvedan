import { Router } from "express";
import { PrismaClient, ComplaintStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";

const prisma = new PrismaClient();
export const reportsRouter = Router();

function ensureRole(role: "ADMIN" | "CITIZEN" | "NGO") {
  return (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== role)
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

function generateComplaintId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const t = String(now.getTime()).slice(-6);
  return `CR${y}${m}${d}${t}`;
}

// Create report (Citizen)
reportsRouter.post(
  "/",
  authMiddleware,
  ensureRole("CITIZEN"),
  async (req: any, res) => {
    try {
      const {
        title,
        description,
        category,
        priority,
        latitude,
        longitude,
        address,
        imageUrl,
      } = req.body || {};
      if (!title || !description || !category || !priority) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Validate that address is provided when coordinates are provided
      if ((latitude !== null && longitude !== null) && (!address || address.trim() === "")) {
        return res.status(400).json({ error: "Address is required when coordinates are provided" });
      }
      const complaintId = generateComplaintId();
      const report = await prisma.complaint.create({
        data: {
          complaintId,
          title,
          description,
          category,
          priority,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          address: address ?? null,
          imageUrl: imageUrl ?? null,
          reportedById: req.user.sub,
        },
      });
      return res.status(201).json(report);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// List my reports (Citizen)
reportsRouter.get(
  "/me",
  authMiddleware,
  ensureRole("CITIZEN"),
  async (req: any, res) => {
    try {
      const reports = await prisma.complaint.findMany({
        where: { reportedById: req.user.sub },
        orderBy: { createdAt: "desc" },
      });
      return res.json(reports);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// List all reports (any authenticated user)
reportsRouter.get("/all", authMiddleware, async (_req: any, res) => {
  try {
    const reports = await prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(reports);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// List all reports (Admin)
reportsRouter.get(
  "/",
  authMiddleware,
  ensureRole("ADMIN"),
  async (_req: any, res) => {
    try {
      const reports = await prisma.complaint.findMany({
        include: {
          helpers: {
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
            }
          }
        },
        orderBy: { createdAt: "desc" },
      });
      return res.json(reports);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update report status (Admin)
reportsRouter.patch(
  "/:id/status",
  authMiddleware,
  ensureRole("ADMIN"),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};
      if (!status || !Object.keys(ComplaintStatus).includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await prisma.complaint.update({
        where: { id },
        data: { status: status as ComplaintStatus },
      });
      return res.json(updated);
    } catch (e: any) {
      if (e?.code === "P2025")
        return res.status(404).json({ error: "Report not found" });
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// NGO: List reports relevant to NGO service area
reportsRouter.get(
  "/for-ngo",
  authMiddleware,
  ensureRole("NGO"),
  async (req: any, res) => {
    try {
      const ngo = await prisma.user.findUnique({
        where: { id: req.user.sub },
      });
      if (!ngo) return res.status(404).json({ error: "NGO not found" });

      // For now, return all reports since we don't have serviceArea in User model
      // You can add serviceArea field to User model if needed
      const reports = await prisma.complaint.findMany({
        orderBy: { createdAt: "desc" },
      });
      return res.json(reports);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Analytics endpoint for admin dashboard
reportsRouter.get(
  "/analytics",
  authMiddleware,
  ensureRole("ADMIN"),
  async (_req: any, res) => {
    try {
      const [
        totalReports,
        pendingReports,
        inProgressReports,
        resolvedToday,
        resolvedReports,
        categoryStats,
        priorityStats,
        statusStats,
      ] = await Promise.all([
        prisma.complaint.count(),
        prisma.complaint.count({ where: { status: "PENDING" } }),
        prisma.complaint.count({ where: { status: "IN_PROGRESS" } }),
        prisma.complaint.count({
          where: {
            status: "RESOLVED",
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.complaint.count({ where: { status: "RESOLVED" } }),
        prisma.complaint.groupBy({
          by: ["category"],
          _count: { category: true },
        }),
        prisma.complaint.groupBy({
          by: ["priority"],
          _count: { priority: true },
        }),
        prisma.complaint.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
      ]);

      const resolutionRate =
        totalReports > 0
          ? Math.round((resolvedReports / totalReports) * 100)
          : 0;

      // Calculate average resolution time (simplified - using days since creation)
      const resolvedComplaints = await prisma.complaint.findMany({
        where: { status: "RESOLVED" },
        select: { createdAt: true, updatedAt: true },
      });

      const avgResolutionTime =
        resolvedComplaints.length > 0
          ? resolvedComplaints.reduce((sum, complaint) => {
              const days = Math.ceil(
                (complaint.updatedAt.getTime() -
                  complaint.createdAt.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return sum + days;
            }, 0) / resolvedComplaints.length
          : 0;

      return res.json({
        totalReports,
        pendingReports,
        inProgressReports,
        resolvedToday,
        resolvedReports,
        resolutionRate,
        avgResolutionTime: avgResolutionTime.toFixed(1),
        categoryStats,
        priorityStats,
        statusStats,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
