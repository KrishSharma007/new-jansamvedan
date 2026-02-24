import { Router } from "express";
import { PrismaClient, ComplaintStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";

const prisma = new PrismaClient();
export const exportRouter = Router();

// Export reports as CSV
exportRouter.get("/reports/csv", authMiddleware, async (req: any, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get all reports with related data
    const reports = await prisma.complaint.findMany({
      include: {
        reportedBy: {
          select: { name: true, email: true, phone: true },
        },
        helpers: {
          include: {
            user: {
              select: { name: true, organization: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert to CSV format
    const csvHeaders = [
      "Complaint ID",
      "Title",
      "Description",
      "Category",
      "Priority",
      "Status",
      "Address",
      "Latitude",
      "Longitude",
      "Image URL",
      "Assigned Department",
      "Reporter Name",
      "Reporter Email",
      "Reporter Phone",
      "Created At",
      "Updated At",
      "Helpers Count",
      "Helper Organizations"
    ];

    const csvRows = reports.map(report => [
      report.complaintId,
      `"${report.title.replace(/"/g, '""')}"`, // Escape quotes
      `"${report.description.replace(/"/g, '""')}"`,
      report.category,
      report.priority,
      report.status,
      `"${report.address?.replace(/"/g, '""') || ''}"`,
      report.latitude?.toString() || '',
      report.longitude?.toString() || '',
      report.imageUrl || '',
      report.assignedDept || '',
      `"${report.reportedBy.name.replace(/"/g, '""')}"`,
      report.reportedBy.email,
      report.reportedBy.phone || '',
      report.createdAt.toISOString(),
      report.updatedAt.toISOString(),
      report.helpers.length.toString(),
      `"${report.helpers.map(h => h.user.organization || h.user.name).join('; ')}"`
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Set headers for file download
    const filename = `civic_reports_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (e) {
    console.error("Export reports error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export reports as JSON
exportRouter.get("/reports/json", authMiddleware, async (req: any, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get all reports with related data
    const reports = await prisma.complaint.findMany({
      include: {
        reportedBy: {
          select: { name: true, email: true, phone: true },
        },
        helpers: {
          include: {
            user: {
              select: { name: true, organization: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format the data
    const exportData = {
      exportDate: new Date().toISOString(),
      totalReports: reports.length,
      reports: reports.map(report => ({
        complaintId: report.complaintId,
        title: report.title,
        description: report.description,
        category: report.category,
        priority: report.priority,
        status: report.status,
        address: report.address,
        location: {
          latitude: report.latitude,
          longitude: report.longitude,
        },
        imageUrl: report.imageUrl,
        assignedDept: report.assignedDept,
        reporter: {
          name: report.reportedBy.name,
          email: report.reportedBy.email,
          phone: report.reportedBy.phone,
        },
        helpers: report.helpers.map(helper => ({
          name: helper.user.name,
          organization: helper.user.organization,
          status: helper.status,
          message: helper.message,
        })),
        timestamps: {
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        },
      })),
    };

    // Set headers for file download
    const filename = `civic_reports_${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportData);

  } catch (e) {
    console.error("Export reports JSON error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export map data as GeoJSON
exportRouter.get("/map/geojson", authMiddleware, async (req: any, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get all reports with location data
    const reports = await prisma.complaint.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      include: {
        reportedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert to GeoJSON format
    const geoJsonData = {
      type: "FeatureCollection",
      features: reports.map(report => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [report.longitude!, report.latitude!]
        },
        properties: {
          complaintId: report.complaintId,
          title: report.title,
          description: report.description,
          category: report.category,
          priority: report.priority,
          status: report.status,
          address: report.address,
          imageUrl: report.imageUrl,
          assignedDept: report.assignedDept,
          reporter: {
            name: report.reportedBy.name,
            email: report.reportedBy.email,
          },
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        }
      }))
    };

    // Set headers for file download
    const filename = `civic_map_data_${new Date().toISOString().split('T')[0]}.geojson`;
    res.setHeader('Content-Type', 'application/geo+json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(geoJsonData);

  } catch (e) {
    console.error("Export map data error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export map data as CSV
exportRouter.get("/map/csv", authMiddleware, async (req: any, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get all reports with location data
    const reports = await prisma.complaint.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      include: {
        reportedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert to CSV format
    const csvHeaders = [
      "Complaint ID",
      "Title",
      "Category",
      "Priority",
      "Status",
      "Address",
      "Latitude",
      "Longitude",
      "Image URL",
      "Assigned Department",
      "Reporter Name",
      "Reporter Email",
      "Created At",
      "Updated At"
    ];

    const csvRows = reports.map(report => [
      report.complaintId,
      `"${report.title.replace(/"/g, '""')}"`,
      report.category,
      report.priority,
      report.status,
      `"${report.address?.replace(/"/g, '""') || ''}"`,
      report.latitude?.toString() || '',
      report.longitude?.toString() || '',
      report.imageUrl || '',
      report.assignedDept || '',
      `"${report.reportedBy.name.replace(/"/g, '""')}"`,
      report.reportedBy.email,
      report.createdAt.toISOString(),
      report.updatedAt.toISOString()
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Set headers for file download
    const filename = `civic_map_data_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (e) {
    console.error("Export map data CSV error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export analytics data
exportRouter.get("/analytics/csv", authMiddleware, async (req: any, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get analytics data
    const totalReports = await prisma.complaint.count();
    const resolvedReports = await prisma.complaint.count({
      where: { status: ComplaintStatus.RESOLVED },
    });

    // Get reports by category
    const reportsByCategory = await prisma.complaint.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });

    // Get reports by status
    const reportsByStatus = await prisma.complaint.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    // Get reports by department
    const reportsByDepartment = await prisma.complaint.groupBy({
      by: ["assignedDept"],
      _count: { assignedDept: true },
      where: { assignedDept: { not: null } },
      orderBy: { _count: { assignedDept: "desc" } },
    });

    // Create CSV content
    const csvContent = [
      "Analytics Report",
      `Generated on,${new Date().toISOString()}`,
      "",
      "Summary",
      `Total Reports,${totalReports}`,
      `Resolved Reports,${resolvedReports}`,
      `Resolution Rate,${totalReports > 0 ? ((resolvedReports / totalReports) * 100).toFixed(2) : 0}%`,
      "",
      "Reports by Category",
      "Category,Count,Percentage",
      ...reportsByCategory.map(item => [
        item.category,
        item._count.category,
        totalReports > 0 ? ((item._count.category / totalReports) * 100).toFixed(2) + '%' : '0%'
      ].join(',')),
      "",
      "Reports by Status",
      "Status,Count,Percentage",
      ...reportsByStatus.map(item => [
        item.status,
        item._count.status,
        totalReports > 0 ? ((item._count.status / totalReports) * 100).toFixed(2) + '%' : '0%'
      ].join(',')),
      "",
      "Reports by Department",
      "Department,Count,Percentage",
      ...reportsByDepartment.map(item => [
        item.assignedDept || 'Unassigned',
        item._count.assignedDept,
        totalReports > 0 ? ((item._count.assignedDept / totalReports) * 100).toFixed(2) + '%' : '0%'
      ].join(','))
    ].join('\n');

    // Set headers for file download
    const filename = `civic_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (e) {
    console.error("Export analytics error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});
