import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";

export const uploadsRouter = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

uploadsRouter.post("/image", async (req, res) => {
  try {
    const { dataUrl, folder, category } = req.body || {};
    if (!dataUrl) return res.status(400).json({ error: "dataUrl is required" });

    // Build organized folder path: jansamvedan/reports/YYYY/MM/<category>
    const baseFolder = (folder as string) || "jansamvedan/reports";
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const safeCategory = (category || "uncategorized")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9\-\s]/g, "")
      .replace(/\s+/g, "-");
    const targetFolder = `${baseFolder}/${year}/${month}/${safeCategory}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: targetFolder,
      resource_type: "image",
      overwrite: false,
      // create a readable public id using timestamp
      public_id: `report_${now.getTime()}`,
    });
    return res
      .status(201)
      .json({
        url: result.secure_url,
        folder: targetFolder,
        publicId: result.public_id,
      });
  } catch (e: any) {
    console.error("Cloudinary upload failed", e);
    return res.status(500).json({ error: "Upload failed" });
  }
});
