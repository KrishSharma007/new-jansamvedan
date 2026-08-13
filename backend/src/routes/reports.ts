import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { enrichWithComputedPriority } from "../utils/priority";
import { sendNotification } from "./notifications";

const prisma = new PrismaClient();
export const reportsRouter = Router();

function ensureRole(...allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role))
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

// Haversine formula to compute distance in meters between two lat/lng coordinates
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find existing nearby / duplicate reports
reportsRouter.post("/find-duplicates", authMiddleware, async (req: any, res) => {
  try {
    const { category, latitude, longitude, address } = req.body || {};
    if (!category) {
      return res.status(400).json({ error: "Category is required for duplicate check" });
    }

    // Active (non-resolved, non-rejected) complaints in same category
    const candidateReports = await prisma.complaint.findMany({
      where: {
        category,
        status: {
          notIn: ["RESOLVED", "REJECTED"],
        },
      },
      include: {
        reportedBy: {
          select: { id: true, name: true },
        },
        confirmations: {
          select: { userId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Filter by proximity (~100m) or address match
    const duplicates = candidateReports.filter((rep) => {
      let isDistanceMatch = false;
      if (
        latitude != null &&
        longitude != null &&
        rep.latitude != null &&
        rep.longitude != null
      ) {
        const dist = getDistanceInMeters(latitude, longitude, rep.latitude, rep.longitude);
        if (dist <= 150) { // ~150 meters threshold
          isDistanceMatch = true;
        }
      }

      let isAddressMatch = false;
      if (address && rep.address) {
        const addrSub = address.toLowerCase().trim();
        const repAddr = rep.address.toLowerCase().trim();
        if (addrSub.includes(repAddr) || repAddr.includes(addrSub)) {
          isAddressMatch = true;
        }
      }

      return isDistanceMatch || isAddressMatch;
    });

    const enriched = duplicates.map((d) => enrichWithComputedPriority(d));
    return res.json(enriched);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Create report (Citizen)
reportsRouter.post(
  "/",
  authMiddleware,
  ensureRole("CITIZEN", "ADMIN"),
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
      if (!title || !description || !category) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (
        latitude !== null &&
        latitude !== undefined &&
        longitude !== null &&
        longitude !== undefined &&
        (!address || address.trim() === "")
      ) {
        return res
          .status(400)
          .json({ error: "Address is required when coordinates are provided" });
      }

      const complaintId = generateComplaintId();
      const report = await prisma.complaint.create({
        data: {
          complaintId,
          title,
          description,
          category,
          priority: priority || "medium",
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          address: address ?? null,
          imageUrl: imageUrl ?? null,
          reportedById: req.user.sub,
        },
        include: {
          reportedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      const enriched = enrichWithComputedPriority(report);

      // Two-way loop: Notify verified NGOs in the service area about new report!
      if (address) {
        const matchingNgos = await prisma.user.findMany({
          where: {
            role: "NGO",
            ngoStatus: "VERIFIED",
            serviceArea: {
              not: null,
            },
          },
        });

        for (const ngo of matchingNgos) {
          if (ngo.serviceArea) {
            const areaKeywords = ngo.serviceArea.toLowerCase().split(/[\s,]+/);
            const reportAddr = address.toLowerCase();
            const isMatch = areaKeywords.some(
              (kw) => kw.length > 2 && reportAddr.includes(kw)
            );

            if (isMatch) {
              await sendNotification({
                userId: ngo.id,
                complaintId: report.id,
                title: "New Civic Issue in Your Service Area",
                message: `A new ${category} issue (${complaintId}) was reported in ${address}.`,
              });
            }
          }
        }
      }

      return res.status(201).json(enriched);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Confirm / Upvote an existing report (Citizen)
reportsRouter.post("/:id/confirm", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { confirmations: true },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Guard 1: Reporter cannot confirm their own report
    if (complaint.reportedById === userId) {
      return res.status(400).json({
        error: "Self-confirmation not allowed. You cannot confirm your own reported issue.",
      });
    }

    // Guard 2: Cannot confirm closed/resolved/rejected complaint
    if (complaint.status === "RESOLVED" || complaint.status === "REJECTED") {
      return res.status(400).json({
        error: "Cannot confirm a report that has already been resolved or rejected.",
      });
    }

    // Guard 3: User already confirmed
    const existingConfirmation = await prisma.complaintConfirmation.findUnique({
      where: {
        complaintId_userId: {
          complaintId: id,
          userId,
        },
      },
    });

    if (existingConfirmation) {
      return res.status(400).json({ error: "You have already confirmed this issue." });
    }

    // Atomic Transaction: Create confirmation row & increment confirmation count
    const [confirmation, updatedComplaint] = await prisma.$transaction([
      prisma.complaintConfirmation.create({
        data: {
          complaintId: id,
          userId,
        },
      }),
      prisma.complaint.update({
        where: { id },
        data: {
          confirmationsCount: {
            increment: 1,
          },
        },
        include: {
          reportedBy: { select: { id: true, name: true, email: true } },
          helpers: { include: { user: true } },
          confirmations: true,
        },
      }),
    ]);

    const enriched = enrichWithComputedPriority(updatedComplaint);

    // Notify reporter that someone confirmed their issue!
    await sendNotification({
      userId: complaint.reportedById,
      complaintId: complaint.id,
      title: "Issue Confirmed by Citizen",
      message: `Another citizen confirmed your report ${complaint.complaintId} (${complaint.title}). Priority score increased!`,
    });

    return res.json({
      success: true,
      message: "Successfully confirmed report",
      report: enriched,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// List my reports (Citizen)
reportsRouter.get("/me", authMiddleware, async (req: any, res) => {
  try {
    const reports = await prisma.complaint.findMany({
      where: { reportedById: req.user.sub },
      include: {
        confirmations: { select: { userId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = reports.map((r) => enrichWithComputedPriority(r));
    return res.json(enriched);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// List all reports (authenticated)
reportsRouter.get("/all", authMiddleware, async (_req: any, res) => {
  try {
    const reports = await prisma.complaint.findMany({
      include: {
        confirmations: { select: { userId: true } },
        helpers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                organization: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = reports.map((r) => enrichWithComputedPriority(r));
    return res.json(enriched);
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
          reportedBy: {
            select: { id: true, name: true, email: true, phone: true },
          },
          helpers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  organization: true,
                  serviceArea: true,
                },
              },
            },
          },
          confirmations: { select: { userId: true, createdAt: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const enriched = reports.map((r) => enrichWithComputedPriority(r));
      return res.json(enriched);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get single report detail with status audit trail
reportsRouter.get("/:id", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const report = await prisma.complaint.findUnique({
      where: { id },
      include: {
        reportedBy: {
          select: { id: true, name: true, email: true, phone: true },
        },
        helpers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                organization: true,
              },
            },
          },
        },
        confirmations: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        statusHistory: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!report) return res.status(404).json({ error: "Report not found" });
    return res.json(enrichWithComputedPriority(report));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update report status (Admin) with audit trail logging & notifications
reportsRouter.patch(
  "/:id/status",
  authMiddleware,
  ensureRole("ADMIN"),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body || {};
      const adminId = req.user.sub;

      if (!status || !["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const existingReport = await prisma.complaint.findUnique({
        where: { id },
      });

      if (!existingReport) {
        return res.status(404).json({ error: "Report not found" });
      }

      const oldStatus = existingReport.status;

      // Update status and insert audit history in single transaction
      const [updatedReport, history] = await prisma.$transaction([
        prisma.complaint.update({
          where: { id },
          data: { status },
          include: {
            reportedBy: { select: { id: true, name: true, email: true } },
            confirmations: true,
          },
        }),
        prisma.complaintStatusHistory.create({
          data: {
            complaintId: id,
            oldStatus,
            newStatus: status,
            changedById: adminId,
            changedByRole: "ADMIN",
            notes: notes || `Status changed from ${oldStatus} to ${status}`,
          },
        }),
      ]);

      const enriched = enrichWithComputedPriority(updatedReport);

      // Send Notification to reporter
      await sendNotification({
        userId: existingReport.reportedById,
        complaintId: existingReport.id,
        title: `Report Status Updated: ${status}`,
        message: `Your complaint ${existingReport.complaintId} status was changed from ${oldStatus} to ${status}.`,
      });

      return res.json({ report: enriched, history });
    } catch (e: any) {
      if (e?.code === "P2025")
        return res.status(404).json({ error: "Report not found" });
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get status history for audit trail
reportsRouter.get("/:id/history", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const history = await prisma.complaintStatusHistory.findMany({
      where: { complaintId: id },
      include: {
        changedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(history);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

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

      if (ngo.ngoStatus === "PENDING") {
        return res.json({
          pendingApproval: true,
          message: "Your NGO account is pending admin verification.",
          reports: [],
        });
      }

      const allReports = await prisma.complaint.findMany({
        include: {
          helpers: {
            include: {
              user: {
                select: { id: true, name: true, organization: true },
              },
            },
          },
          confirmations: { select: { userId: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      let filteredReports = allReports;

      // Filter by service area if present
      if (ngo.serviceArea && ngo.serviceArea.trim() !== "" && ngo.serviceArea.toLowerCase() !== "all") {
        const serviceKeywords = ngo.serviceArea
          .toLowerCase()
          .split(/[\s,]+/)
          .filter((k) => k.length > 2);

        filteredReports = allReports.filter((report) => {
          const reportText = `${report.address || ""} ${report.title || ""} ${report.category || ""}`.toLowerCase();
          return serviceKeywords.some((kw) => reportText.includes(kw));
        });
      }

      const enriched = filteredReports.map((r) => enrichWithComputedPriority(r));

      return res.json({
        pendingApproval: false,
        serviceArea: ngo.serviceArea || "All Areas",
        reports: enriched,
      });
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
          by: ["status"],
          _count: { status: true },
        }),
      ]);

      const resolutionRate =
        totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

      const resolvedComplaints = await prisma.complaint.findMany({
        where: { status: "RESOLVED" },
        select: { createdAt: true, updatedAt: true },
      });

      const avgResolutionTime =
        resolvedComplaints.length > 0
          ? resolvedComplaints.reduce((sum, complaint) => {
              const days = Math.ceil(
                (complaint.updatedAt.getTime() - complaint.createdAt.getTime()) /
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
        statusStats,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
