import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

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

    // 1. Try Cloudinary upload if credentials are provided
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
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
          public_id: `report_${now.getTime()}`,
        });

        return res.status(201).json({
          url: result.secure_url,
          folder: targetFolder,
          publicId: result.public_id,
        });
      } catch (cloudErr) {
        console.warn("Cloudinary upload failed, falling back to local file storage:", cloudErr);
      }
    }

    // 2. Fallback: Save file to local disk and serve via static endpoint
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
    const fileUrl = `${protocol}://${host}/uploads/files/${filename}`;

    return res.status(201).json({
      url: fileUrl,
      folder: "local",
      publicId: filename,
    });
  } catch (e: any) {
    console.error("Upload handler error:", e);
    return res.status(500).json({ error: "Upload failed" });
  }
});
