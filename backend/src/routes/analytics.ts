import { Router } from "express";
import { PrismaClient, ComplaintStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";

const prisma = new PrismaClient();
export const analyticsRouter = Router();

// Get analytics overview
analyticsRouter.get("/overview", authMiddleware, async (req: any, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get total reports
    const totalReports = await prisma.complaint.count();

    // Get resolved reports
    const resolvedReports = await prisma.complaint.count({
      where: { status: ComplaintStatus.RESOLVED },
    });

    // Calculate resolution rate
    const resolutionRate = totalReports > 0 ? (resolvedReports / totalReports) * 100 : 0;

    // Get average resolution time (in days)
    const resolvedComplaints = await prisma.complaint.findMany({
      where: { status: ComplaintStatus.RESOLVED },
      select: { createdAt: true, updatedAt: true },
    });

    const avgResolutionTime = resolvedComplaints.length > 0
      ? resolvedComplaints.reduce((sum, complaint) => {
          const resolutionTime = complaint.updatedAt.getTime() - complaint.createdAt.getTime();
          return sum + resolutionTime;
        }, 0) / resolvedComplaints.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Get total users
    const totalUsers = await prisma.user.count({
      where: { role: { not: "ADMIN" } }, // Exclude admin users
    });

    // Get reports by status
    const reportsByStatus = await prisma.complaint.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    // Get reports by category
    const reportsByCategory = await prisma.complaint.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });

    // Get reports by department
    const reportsByDepartment = await prisma.complaint.groupBy({
      by: ["assignedDept"],
      _count: { assignedDept: true },
      where: { assignedDept: { not: null } },
      orderBy: { _count: { assignedDept: "desc" } },
    });

    // Calculate department performance
    const departmentPerformance = await Promise.all(
      reportsByDepartment.map(async (dept) => {
        const deptReports = await prisma.complaint.findMany({
          where: { assignedDept: dept.assignedDept },
          select: { status: true, createdAt: true, updatedAt: true },
        });

        const resolved = deptReports.filter(r => r.status === ComplaintStatus.RESOLVED).length;
        const resolutionRate = deptReports.length > 0 ? (resolved / deptReports.length) * 100 : 0;

        const avgResponseTime = resolved > 0
          ? deptReports
              .filter(r => r.status === ComplaintStatus.RESOLVED)
              .reduce((sum, r) => {
                const time = r.updatedAt.getTime() - r.createdAt.getTime();
                return sum + time;
              }, 0) / resolved / (1000 * 60 * 60 * 24)
          : 0;

        return {
          department: dept.assignedDept,
          totalReports: dept._count.assignedDept,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10,
          performance: resolutionRate >= 80 ? "Excellent" : 
                     resolutionRate >= 70 ? "Good" : 
                     resolutionRate >= 60 ? "Average" : "Needs Improvement"
        };
      })
    );

    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await prisma.complaint.groupBy({
      by: ["createdAt"],
      _count: { createdAt: true },
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by month
    const monthlyData = monthlyTrends.reduce((acc, item) => {
      const month = item.createdAt.toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + item._count.createdAt;
      return acc;
    }, {} as Record<string, number>);

    // Get resolved reports by month
    const resolvedMonthlyTrends = await prisma.complaint.groupBy({
      by: ["updatedAt"],
      _count: { updatedAt: true },
      where: {
        status: ComplaintStatus.RESOLVED,
        updatedAt: { gte: sixMonthsAgo },
      },
      orderBy: { updatedAt: "asc" },
    });

    const resolvedMonthlyData = resolvedMonthlyTrends.reduce((acc, item) => {
      const month = item.updatedAt.toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + item._count.updatedAt;
      return acc;
    }, {} as Record<string, number>);

    // Format monthly trends
    const monthlyTrendsFormatted = Object.keys(monthlyData).map(month => ({
      month,
      submitted: monthlyData[month],
      resolved: resolvedMonthlyData[month] || 0,
    }));

    res.json({
      overview: {
        totalReports,
        resolvedReports,
        resolutionRate: Math.round(resolutionRate * 100) / 100,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        totalUsers,
      },
      reportsByStatus: reportsByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
        percentage: totalReports > 0 ? Math.round((item._count.status / totalReports) * 100 * 100) / 100 : 0,
      })),
      reportsByCategory: reportsByCategory.map(item => ({
        category: item.category,
        count: item._count.category,
        percentage: totalReports > 0 ? Math.round((item._count.category / totalReports) * 100 * 100) / 100 : 0,
      })),
      departmentPerformance,
      monthlyTrends: monthlyTrendsFormatted,
    });
  } catch (e) {
    console.error("Analytics error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get detailed analytics for specific time period
analyticsRouter.get("/detailed", authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { startDate, endDate } = req.query;
    
    let whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Get reports in time period
    const reports = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        reportedBy: {
          select: { name: true, email: true },
        },
        helpers: {
          include: {
            user: {
              select: { name: true, organization: true },
            },
          },
        },
      },
    });

    // Calculate various metrics
    const totalReports = reports.length;
    const resolvedReports = reports.filter(r => r.status === ComplaintStatus.RESOLVED).length;
    const pendingReports = reports.filter(r => r.status === ComplaintStatus.PENDING).length;
    const inProgressReports = reports.filter(r => r.status === ComplaintStatus.IN_PROGRESS).length;

    // Priority distribution
    const priorityDistribution = reports.reduce((acc, report) => {
      acc[report.priority] = (acc[report.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Category distribution
    const categoryDistribution = reports.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top reporters
    const topReporters = reports.reduce((acc, report) => {
      const reporterId = report.reportedById;
      if (!acc[reporterId]) {
        acc[reporterId] = {
          name: report.reportedBy.name,
          email: report.reportedBy.email,
          count: 0,
        };
      }
      acc[reporterId].count++;
      return acc;
    }, {} as Record<string, { name: string; email: string; count: number }>);

    const topReportersArray = Object.values(topReporters)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      timeRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        totalReports,
        resolvedReports,
        pendingReports,
        inProgressReports,
        resolutionRate: totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100 * 100) / 100 : 0,
      },
      distributions: {
        priority: priorityDistribution,
        category: categoryDistribution,
      },
      topReporters: topReportersArray,
      reports: reports.map(report => ({
        id: report.id,
        complaintId: report.complaintId,
        title: report.title,
        category: report.category,
        priority: report.priority,
        status: report.status,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        reporter: report.reportedBy,
        helpersCount: report.helpers.length,
        assignedDept: report.assignedDept,
      })),
    });
  } catch (e) {
    console.error("Detailed analytics error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});
