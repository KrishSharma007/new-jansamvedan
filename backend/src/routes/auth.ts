import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signJwt } from "../utils/jwt";
import { authMiddleware } from "../middleware/auth";

const prisma = new PrismaClient();
export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address, role, department, organization, serviceArea } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing required fields (Name, Email, Password)" });

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing)
      return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Determine user role and default verification status
    const normalizedRole = (role || "").toUpperCase();
    const isNgo = normalizedRole === "NGO";
    const isAdmin = normalizedRole === "ADMIN";
    const userRole = isAdmin ? "ADMIN" : isNgo ? "NGO" : "CITIZEN";
    const ngoStatus = isNgo ? "PENDING" : "VERIFIED";

    // Create user with appropriate role and role-specific fields
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        role: userRole,
        ngoStatus,
        department: isAdmin ? (department || "General Administration") : null,
        organization: isNgo ? organization : null,
        serviceArea: isNgo ? serviceArea : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        ngoStatus: true,
        department: true,
        organization: true,
        serviceArea: true,
        createdAt: true,
      },
    });

    if (isNgo) {
      // Notify all existing admins about the new NGO registration
      try {
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
        for (const adm of admins) {
          await prisma.notification.create({
            data: {
              userId: adm.id,
              title: "New NGO Registration Pending",
              message: `${organization || name} has registered as an NGO partner and is pending verification.`,
              isRead: false,
            },
          });
        }
      } catch (notifErr) {
        console.error("Error creating NGO registration notification:", notifErr);
      }
    }

    const token = signJwt({ sub: user.id, role: user.role });
    return res.status(201).json({ token, user });
  } catch (e) {
    console.error("Registration error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const normalizedEmail = email.trim().toLowerCase();
    // Check User table for all roles
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Compare passwords
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signJwt({ sub: user.id, role: user.role });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        department: user.department,
        ngoStatus: user.ngoStatus,
        organization: user.organization,
        serviceArea: user.serviceArea,
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.get("/me", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        department: true,
        ngoStatus: true,
        organization: true,
        serviceArea: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ user });
  } catch (e) {
    console.error("Auth /me error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all users (Admin only)
authRouter.get("/users", authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        ngoStatus: true,
        organization: true,
        serviceArea: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            complaints: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(users);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all NGOs for Admin management
authRouter.get("/ngos", authMiddleware, async (req: any, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    if (!admin || admin.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can manage NGOs" });
    }

    const ngos = await prisma.user.findMany({
      where: { role: "NGO" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        organization: true,
        serviceArea: true,
        ngoStatus: true,
        createdAt: true,
        helpingWith: {
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
        },
        _count: {
          select: {
            helpingWith: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(ngos);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Admin endpoint to Approve/Reject NGO application
authRouter.patch("/ngos/:id/status", authMiddleware, async (req: any, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    if (!admin || admin.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can update NGO status" });
    }

    const { id } = req.params;
    const { ngoStatus } = req.body || {};

    if (!ngoStatus || !["VERIFIED", "PENDING", "REJECTED"].includes(ngoStatus)) {
      return res.status(400).json({ error: "Invalid NGO status" });
    }

    const updatedNgo = await prisma.user.update({
      where: { id, role: "NGO" },
      data: { ngoStatus },
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        ngoStatus: true,
      },
    });



    return res.json(updatedNgo);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "NGO not found" });
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile
authRouter.put("/profile", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.sub;
    const { name, email, phone, address, department, organization, serviceArea } = req.body || {};
    
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    
    if (currentUser.role === "ADMIN") {
      if (department !== undefined) updateData.department = department;
    }

    if (currentUser.role === "NGO") {
      if (organization !== undefined) updateData.organization = organization;
      if (serviceArea !== undefined) updateData.serviceArea = serviceArea;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        department: true,
        ngoStatus: true,
        organization: true,
        serviceArea: true,
      },
    });

    return res.json(updatedUser);
  } catch (e) {
    console.error("Profile update error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/logout", async (_req, res) => {
  try {
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});
