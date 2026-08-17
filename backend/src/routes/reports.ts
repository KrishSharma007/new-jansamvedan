import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { enrichWithComputedPriority } from "../utils/priority";

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
    const { latitude, longitude, address } = req.body || {};
    const currentUserId = req.user?.sub || req.user?.id;

    // Active (non-resolved, non-rejected) complaints NOT created by the current user
    const candidateReports = await prisma.complaint.findMany({
      where: {
        status: {
          notIn: ["RESOLVED", "REJECTED"],
        },
        ...(currentUserId ? { reportedById: { not: currentUserId } } : {}),
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
      take: 50,
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
        description,
        isAnonymous,
        latitude,
        longitude,
        address,
        imageUrl,
        dataUrl,
      } = req.body || {};
      
      if (!description || description.trim().length === 0) {
        return res.status(400).json({ error: "Description is required" });
      }

      // Mandatory Photo Validation
      if ((!dataUrl || dataUrl.trim().length < 50) && (!imageUrl || imageUrl.trim().length < 5)) {
        return res.status(400).json({
          error: "Photo evidence is mandatory for all reports. Please capture or upload a clear photo of the civic issue.",
        });
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

      // Verify user exists in database to prevent foreign key constraint violation
      const user = await prisma.user.findUnique({
        where: { id: req.user.sub },
      });
      if (!user) {
        return res.status(401).json({
          error: "Session expired or user account not found. Please log in again.",
        });
      }

      let category = "Other";
      let priority = "medium";
      let title = "Civic Hazard Report";
      let visualCaption = "";

      const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

      // ── Unified Single-Pass Qwen3-VL Multimodal Vision + Anti-Spam Pipeline ──
      if (dataUrl && dataUrl.length > 50) {
        try {
          const base64Data = dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : dataUrl;
          console.log("--> Running Unified Qwen3-VL Vision + Anti-Spam Analysis...");

          const visionPrompt = `You are JanSamvedan AI, an expert municipal civic hazard inspector and anti-spam validator.
Analyze the user's uploaded photo along with their textual notes: "${description}".

Tasks:
1. Anti-Spam Check: Is this a genuine civic issue, public infrastructure damage, or environmental hazard? If it is a selfie, personal portrait, animal photo, meme, vulgar image, promotional ad, or completely black/blurry, set "isSpam": true with a short "spamReason".
2. Categorization: Choose the single most accurate category from:
   ["Pothole", "Garbage Collection", "Street Light", "Water Supply", "Drainage", "Traffic Signal", "Park Maintenance", "Encroachment", "Tree Hazard", "Other"]
3. Title: Create a concise, title-cased headline (max 5 words, e.g., "Deep Pothole On Road").
4. Priority: Evaluate safety severity based on visual damage:
   - "high": Road craters, open manholes, exposed live wires, major water pipeline burst, severe sewage overflow, fallen trees.
   - "medium": Overflowing garbage dump, broken street light, damaged park bench, minor leakage.
   - "low": Minor cosmetic damage, small roadside litter.
5. Visual Summary: Write 1 clear sentence describing the exact issue and hazard shown.

Respond ONLY with a valid JSON object:
{
  "isSpam": false,
  "spamReason": null,
  "category": "Pothole",
  "title": "Deep Pothole On Road",
  "priority": "high",
  "visualSummary": "A large pothole in the asphalt with accumulated water creating a road hazard."
}`;

          const visionRes = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "qwen3-vl:2b-instruct-q4_K_M",
              prompt: visionPrompt,
              images: [base64Data],
              stream: false,
              options: { temperature: 0.1, num_predict: 250, num_ctx: 2048 },
            }),
          }).catch(() => null);

          if (visionRes && visionRes.ok) {
            const vData = await visionRes.json();
            const rawV = (vData.response || "").replace(/```json|```/gi, "").trim();
            const jsonMatch = rawV.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                console.log("Qwen3-VL Multimodal Result:", parsed);

                // Anti-spam filter
                if (parsed.isSpam === true) {
                  return res.status(400).json({
                    error: `Photo rejected by AI safety filter: ${parsed.spamReason || "The image does not show a valid civic issue or public infrastructure hazard."}`,
                    isSpam: true,
                  });
                }

                if (parsed.category && parsed.category !== "Other") category = parsed.category;
                if (parsed.title && parsed.title !== "Civic Issue") title = parsed.title;
                if (parsed.priority && ["low", "medium", "high"].includes(parsed.priority)) priority = parsed.priority;
                if (parsed.visualSummary) visualCaption = parsed.visualSummary;
              } catch (e) {
                console.warn("Qwen3-VL JSON parse error:", e);
              }
            }
          }
        } catch (mErr) {
          console.warn("Server Qwen3-VL analysis skipped:", mErr);
        }
      }

      // Fallback title formatting if needed
      if (!title || title === "Civic Hazard Report") {
        if (category && category !== "Other") {
          title = `${category} Hazard`;
        } else if (description && description.trim().length > 0) {
          const words = description.trim().split(/\s+/).slice(0, 5);
          title = words.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }
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
          isAnonymous: Boolean(isAnonymous),
          reportedById: req.user.sub,
        },
        include: {
          reportedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      const enriched = enrichWithComputedPriority(report);

      // Notify all ADMIN users about the new report
      try {
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              complaintId: report.id,
              title: `New Report: ${title}`,
              message: `A new civic report (#${report.complaintId}) has been filed in category "${category}" at ${address || "unknown location"}.`,
            })),
          });
        }
      } catch (notifErr) {
        console.error("Admin notification error:", notifErr);
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

const ROHINI_LOCALITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "sector 3": { lat: 28.698, lng: 77.114 },
  "sector 7": { lat: 28.705, lng: 77.118 },
  "sector 8": { lat: 28.708, lng: 77.122 },
  "sector 9": { lat: 28.712, lng: 77.127 },
  "sector 11": { lat: 28.723, lng: 77.111 },
  "sector 14": { lat: 28.718, lng: 77.132 },
  "sector 15": { lat: 28.729, lng: 77.125 },
  "sector 16": { lat: 28.735, lng: 77.12 },
  "sector 18": { lat: 28.742, lng: 77.135 },
  "sector 20": { lat: 28.724, lng: 77.075 },
  "sector 22": { lat: 28.726, lng: 77.065 },
  "sector 24": { lat: 28.729, lng: 77.052 },
  "sector 25": { lat: 28.734, lng: 77.045 },
  "prashant vihar": { lat: 28.71, lng: 77.136 },
  "pitampura": { lat: 28.699, lng: 77.14 },
  "budh vihar": { lat: 28.716, lng: 77.085 },
  "pooth kalan": { lat: 28.722, lng: 77.078 },
  "rithala": { lat: 28.72, lng: 77.105 },
  "shalimar bagh": { lat: 28.715, lng: 77.155 },
};

function getAnchorCoordinates(
  serviceArea?: string | null,
  address?: string | null,
  clientLat?: number,
  clientLng?: number,
  mode?: "service" | "live"
) {
  if (mode === "live" && clientLat && clientLng) {
    return { lat: clientLat, lng: clientLng, source: "Live Field GPS" };
  }

  const searchTarget = `${serviceArea || ""} ${address || ""}`.toLowerCase();
  for (const [key, coords] of Object.entries(ROHINI_LOCALITY_COORDINATES)) {
    if (searchTarget.includes(key)) {
      return { ...coords, source: `Registered Office (${key.toUpperCase()})` };
    }
  }
  return { lat: 28.705, lng: 77.118, source: "Registered Area (Sector 7)" };
}

// NGO: List reports relevant to NGO service area with GPS distance & circular radius
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

      const anchorMode = (req.query.anchorMode === "live" ? "live" : "service") as "service" | "live";
      const clientLat = req.query.lat ? parseFloat(req.query.lat) : undefined;
      const clientLng = req.query.lng ? parseFloat(req.query.lng) : undefined;
      const radiusKm = req.query.radius ? parseFloat(req.query.radius) : undefined; // e.g. 2, 5, 10, or undefined for all

      const anchor = getAnchorCoordinates(ngo.serviceArea, ngo.address, clientLat, clientLng, anchorMode);

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

      // Compute Haversine distance from NGO anchor to each report
      const serviceKeywords = (ngo.serviceArea || "")
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((k) => k.length > 2);

      const reportsWithDistance = allReports.map((report) => {
        let distanceMeters: number | null = null;
        let distanceKm: number | null = null;

        if (report.latitude != null && report.longitude != null) {
          distanceMeters = Math.round(
            getDistanceInMeters(anchor.lat, anchor.lng, report.latitude, report.longitude)
          );
          distanceKm = Number((distanceMeters / 1000).toFixed(1));
        }

        const enriched = enrichWithComputedPriority(report);
        return {
          ...enriched,
          distanceMeters,
          distanceKm,
        };
      });

      // Filter by circular GPS radius if specified (or hybrid fallback to keyword)
      let filteredReports = reportsWithDistance;
      if (radiusKm && !isNaN(radiusKm) && radiusKm > 0) {
        filteredReports = reportsWithDistance.filter((report) => {
          if (report.distanceKm !== null) {
            return report.distanceKm <= radiusKm;
          }
          // Hybrid fallback if coordinates are missing
          const reportText = `${report.address || ""} ${report.title || ""} ${report.category || ""}`.toLowerCase();
          return serviceKeywords.some((kw) => reportText.includes(kw));
        });
      } else if (
        ngo.serviceArea &&
        ngo.serviceArea.trim() !== "" &&
        ngo.serviceArea.toLowerCase() !== "all"
      ) {
        // Default radius filter: 6km around NGO anchor OR keyword match
        filteredReports = reportsWithDistance.filter((report) => {
          if (report.distanceKm !== null && report.distanceKm <= 6.0) {
            return true;
          }
          const reportText = `${report.address || ""} ${report.title || ""} ${report.category || ""}`.toLowerCase();
          return serviceKeywords.some((kw) => reportText.includes(kw));
        });
      }

      return res.json({
        pendingApproval: false,
        serviceArea: ngo.serviceArea || "All Areas",
        anchorMode,
        anchorCoords: {
          lat: anchor.lat,
          lng: anchor.lng,
          source: anchor.source,
        },
        appliedRadiusKm: radiusKm || 6.0,
        reports: filteredReports,
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

// ─── Admin: Detect duplicate clusters ──────────────────────────────
// Groups active complaints within 200m of each other with the same category
reportsRouter.get(
  "/admin/duplicate-clusters",
  authMiddleware,
  ensureRole("ADMIN"),
  async (_req: any, res) => {
    try {
      const activeReports = await prisma.complaint.findMany({
        where: {
          status: { notIn: ["RESOLVED", "REJECTED"] },
          mergedIntoId: null,
          latitude: { not: null },
          longitude: { not: null },
        },
        include: {
          reportedBy: { select: { id: true, name: true, email: true } },
          confirmations: { select: { userId: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      // Build proximity clusters (200m radius, same category)
      const visited = new Set<string>();
      const clusters: any[] = [];

      for (const report of activeReports) {
        if (visited.has(report.id)) continue;
        if (report.latitude == null || report.longitude == null) continue;

        const cluster: any[] = [report];
        visited.add(report.id);

        for (const candidate of activeReports) {
          if (visited.has(candidate.id)) continue;
          if (candidate.latitude == null || candidate.longitude == null) continue;

          const sameCategory = report.category.toLowerCase() === candidate.category.toLowerCase();
          const dist = getDistanceInMeters(
            report.latitude, report.longitude,
            candidate.latitude, candidate.longitude
          );

          const addressOverlap = report.address && candidate.address &&
            (report.address.toLowerCase().includes(candidate.address.toLowerCase()) ||
             candidate.address.toLowerCase().includes(report.address.toLowerCase()));

          if ((sameCategory && dist <= 200) || (addressOverlap && dist <= 300)) {
            cluster.push(candidate);
            visited.add(candidate.id);
          }
        }

        if (cluster.length >= 2) {
          const sorted = [...cluster].sort((a, b) => (b.confirmationsCount || 0) - (a.confirmationsCount || 0));
          clusters.push({
            masterId: sorted[0].id,
            masterComplaintId: sorted[0].complaintId,
            masterTitle: sorted[0].title,
            category: sorted[0].category,
            totalConfirmations: sorted.reduce((sum, r) => sum + (r.confirmationsCount || 0), 0),
            reports: sorted.map((r) => enrichWithComputedPriority(r)),
          });
        }
      }

      return res.json(clusters);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── Admin: Spam / low-quality flagged reports ──────────────────────
reportsRouter.get(
  "/admin/spam-flagged",
  authMiddleware,
  ensureRole("ADMIN"),
  async (_req: any, res) => {
    try {
      const activeReports = await prisma.complaint.findMany({
        where: {
          status: { notIn: ["RESOLVED", "REJECTED"] },
          mergedIntoId: null,
        },
        include: {
          reportedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const flagged: any[] = [];

      for (const report of activeReports) {
        const flags: string[] = [];

        if (!report.description || report.description.trim().length < 10) {
          flags.push("Very short description");
        }

        const desc = (report.description || "").toLowerCase();
        if (/^(.)\1{5,}$/.test(desc.replace(/\s/g, "")) || /^(..)\1{3,}$/.test(desc.replace(/\s/g, ""))) {
          flags.push("Repetitive/gibberish content");
        }

        if (report.latitude == null && report.longitude == null && !report.address) {
          flags.push("No location data provided");
        }

        if (!report.imageUrl) {
          flags.push("No photo evidence submitted");
        }

        if (report.title === "Civic Issue" || report.title === "Civic Issue Report") {
          flags.push("Generic/placeholder title (AI analysis may have failed)");
        }

        const recentByUser = activeReports.filter(
          (r) =>
            r.reportedById === report.reportedById &&
            new Date(r.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
        );
        if (recentByUser.length > 3) {
          flags.push(`High volume: ${recentByUser.length} reports in 24h by same user`);
        }

        if (flags.length > 0) {
          flagged.push({
            ...enrichWithComputedPriority(report),
            spamFlags: flags,
            flagCount: flags.length,
          });
        }
      }

      flagged.sort((a, b) => b.flagCount - a.flagCount);
      return res.json(flagged);
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
            changedBy: { select: { id: true, name: true, role: true, organization: true, email: true } },
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
      const { status, notes, assignedDept } = req.body || {};
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
      const updateData: any = { status };
      if (assignedDept !== undefined) {
        updateData.assignedDept = assignedDept;
      }

      // Update status and insert audit history in single transaction
      const [updatedReport, history] = await prisma.$transaction([
        prisma.complaint.update({
          where: { id },
          data: updateData,
          include: {
            reportedBy: { select: { id: true, name: true, email: true } },
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

      if (updatedReport.reportedById) {
        await prisma.notification.create({
          data: {
            userId: updatedReport.reportedById,
            complaintId: id,
            title: `Update on Report #${updatedReport.complaintId || id.slice(0, 6)}`,
            message: notes || `Status updated to ${status}${assignedDept ? ` (${assignedDept})` : ''}`,
          },
        }).catch((err) => console.error("Notification creation error:", err));
      }

      // Notify all NGO helpers on this report about status change
      if (updatedReport.helpers && updatedReport.helpers.length > 0) {
        try {
          const ngoNotifs = updatedReport.helpers
            .filter((h: any) => h.userId && h.userId !== adminId)
            .map((h: any) => ({
              userId: h.userId,
              complaintId: id,
              title: `Report #${updatedReport.complaintId || id.slice(0, 6)} Status Update`,
              message: `Status changed to ${status}. ${notes || ''}`.trim(),
            }));
          if (ngoNotifs.length > 0) {
            await prisma.notification.createMany({ data: ngoNotifs });
          }
        } catch (ngoErr) {
          console.error("NGO notification error:", ngoErr);
        }
      }

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


// ─── Admin: Merge duplicate report into a master report ─────────────
reportsRouter.post(
  "/:id/merge",
  authMiddleware,
  ensureRole("ADMIN"),
  async (req: any, res) => {
    try {
      const { id } = req.params; // duplicate report ID
      const { masterReportId } = req.body || {};
      const adminId = req.user.sub;

      if (!masterReportId) {
        return res.status(400).json({ error: "masterReportId is required" });
      }

      if (id === masterReportId) {
        return res.status(400).json({ error: "Cannot merge a report into itself" });
      }

      const [duplicate, master] = await Promise.all([
        prisma.complaint.findUnique({ where: { id } }),
        prisma.complaint.findUnique({ where: { id: masterReportId } }),
      ]);

      if (!duplicate) return res.status(404).json({ error: "Duplicate report not found" });
      if (!master) return res.status(404).json({ error: "Master report not found" });

      // Execute merge transaction
      const results = await prisma.$transaction([
        // 1. Mark duplicate as RESOLVED + linked to master
        prisma.complaint.update({
          where: { id },
          data: {
            status: "RESOLVED",
            mergedIntoId: masterReportId,
          },
        }),

        // 2. Transfer confirmation count to master
        prisma.complaint.update({
          where: { id: masterReportId },
          data: {
            confirmationsCount: {
              increment: (duplicate.confirmationsCount || 0) + 1, // +1 for the duplicate reporter as implicit confirm
            },
          },
        }),

        // 3. Audit trail on duplicate
        prisma.complaintStatusHistory.create({
          data: {
            complaintId: id,
            oldStatus: duplicate.status,
            newStatus: "RESOLVED",
            changedById: adminId,
            changedByRole: "ADMIN",
            notes: `Merged into master report #${master.complaintId}. Crowd confirmations transferred.`,
          },
        }),

        // 4. Audit trail on master
        prisma.complaintStatusHistory.create({
          data: {
            complaintId: masterReportId,
            oldStatus: master.status,
            newStatus: master.status,
            changedById: adminId,
            changedByRole: "ADMIN",
            notes: `Duplicate report #${duplicate.complaintId} merged. +${(duplicate.confirmationsCount || 0) + 1} confirmations absorbed.`,
          },
        }),

        // 5. Notify duplicate reporter
        prisma.notification.create({
          data: {
            userId: duplicate.reportedById,
            complaintId: masterReportId,
            title: `Your Report #${duplicate.complaintId} Was Merged`,
            message: `Your report has been merged into master report #${master.complaintId}. You are now automatically subscribed to receive all live progress updates on the consolidated issue.`,
          },
        }),

        // 6. Notify master reporter
        prisma.notification.create({
          data: {
            userId: master.reportedById,
            complaintId: masterReportId,
            title: `Duplicate Merged Into Your Report #${master.complaintId}`,
            message: `A duplicate report has been verified and merged into your issue. Your priority score has been boosted with additional crowd confirmations.`,
          },
        }),
      ]);

      return res.json({
        message: `Report #${duplicate.complaintId} successfully merged into #${master.complaintId}`,
        duplicate: results[0],
        master: results[1],
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
