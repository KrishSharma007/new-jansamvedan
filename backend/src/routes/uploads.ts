import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const uploadsRouter = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 🛠 Utility: Upload a local file path to Cloudinary
 */
async function uploadLocalFileToCloudinary(filePath: string, category?: string): Promise<string | null> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return null;
  }
  if (!fs.existsSync(filePath)) return null;

  try {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const safeCategory = (category || "uncategorized")
      .toLowerCase()
      .replace(/[^a-z0-9\-\s]/g, "")
      .replace(/\s+/g, "-");
    const targetFolder = `jansamvedan/reports/${year}/${month}/${safeCategory}`;

    const uploadPromise = cloudinary.uploader.upload(filePath, {
      folder: targetFolder,
      resource_type: "image",
      overwrite: false,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Cloudinary timeout")), 4000)
    );

    const result: any = await Promise.race([uploadPromise, timeoutPromise]);
    return result.secure_url || null;
  } catch (err: any) {
    console.warn("Cloudinary upload attempt failed/skipped:", err?.message || err);
    return null;
  }
}

/**
 * 🔄 Auto-Sync background helper: syncs all local images in DB to Cloudinary when online
 */
export async function syncLocalImagesToCloudinary() {
  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  if (!hasCloudinary) return { synced: 0, message: "Cloudinary credentials not set" };

  try {
    const localComplaints = await prisma.complaint.findMany({
      where: {
        imageUrl: {
          contains: "/uploads/files/",
        },
      },
    });

    if (localComplaints.length === 0) {
      return { synced: 0, message: "All images are already synced to Cloudinary" };
    }

    console.log(`🔄 [Cloudinary Sync Engine] Found ${localComplaints.length} local images to sync...`);
    let syncedCount = 0;
    const uploadsDir = path.join(process.cwd(), "uploads");

    for (const report of localComplaints) {
      if (!report.imageUrl) continue;
      const filename = path.basename(report.imageUrl);
      const filePath = path.join(uploadsDir, filename);

      if (fs.existsSync(filePath)) {
        const cloudUrl = await uploadLocalFileToCloudinary(filePath, report.category);
        if (cloudUrl) {
          await prisma.complaint.update({
            where: { id: report.id },
            data: { imageUrl: cloudUrl },
          });
          syncedCount++;
          console.log(`✅ Synced report #${report.complaintId} image to Cloudinary: ${cloudUrl}`);
        }
      }
    }

    return { synced: syncedCount, total: localComplaints.length };
  } catch (e: any) {
    console.error("Cloudinary background sync error:", e);
    return { synced: 0, error: e.message };
  }
}

// Auto-run background sync check every 2 minutes
setInterval(() => {
  syncLocalImagesToCloudinary().catch(() => {});
}, 2 * 60 * 1000);

// ─── Upload Handler ─────────────────────────────────────────────────
uploadsRouter.post("/image", async (req, res) => {
  try {
    const { dataUrl, folder, category } = req.body || {};
    if (!dataUrl) return res.status(400).json({ error: "dataUrl is required" });

    // 1. ALWAYS save to local disk FIRST (Guarantees 100% offline hackathon safety)
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let ext = "jpg";
    let base64Data = dataUrl;

    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9-+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      base64Data = matches[2];
    } else if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
      return res.status(200).json({ url: dataUrl });
    }

    const filename = `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    const host = req.get("host") || "localhost:4000";
    const protocol = req.protocol || "http";
    const localUrl = `${protocol}://${host}/uploads/files/${filename}`;

    // 2. Try to sync to Cloudinary if online and not forced to local
    const forceLocal = process.env.USE_LOCAL_STORAGE === "true";
    let finalUrl = localUrl;
    let isCloudSynced = false;

    if (!forceLocal) {
      const cloudUrl = await uploadLocalFileToCloudinary(filePath, category);
      if (cloudUrl) {
        finalUrl = cloudUrl;
        isCloudSynced = true;
      }
    }

    return res.status(201).json({
      url: finalUrl,
      localUrl,
      isCloudSynced,
      publicId: filename,
    });
  } catch (e: any) {
    console.error("Upload handler error:", e);
    return res.status(500).json({ error: "Upload failed" });
  }
});

// ─── Manual Sync Endpoint ───────────────────────────────────────────
// Allows admin or client to trigger a sync of all offline local images to Cloudinary anytime
uploadsRouter.post("/sync-cloudinary", async (_req, res) => {
  const result = await syncLocalImagesToCloudinary();
  return res.json(result);
});
