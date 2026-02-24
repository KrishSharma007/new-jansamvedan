"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Eye,
  UserCheck,
  MapPin,
  Calendar,
  Download,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
type ApiReport = {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  address: string | null;
  createdAt: string;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "resolved":
      return "bg-green-100 text-green-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    case "assigned":
      return "bg-yellow-100 text-yellow-800";
    case "pending":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "resolved":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "in-progress":
      return <Clock className="h-4 w-4 text-blue-600" />;
    case "assigned":
      return <UserCheck className="h-4 w-4 text-yellow-600" />;
    case "pending":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

export default function AdminReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized");
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load reports");
        const data = await res.json();
        setReports(data);
      } catch (e: any) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.address || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || report.status.toLowerCase() === statusFilter;
    const matchesPriority =
      priorityFilter === "all" ||
      report.priority.toLowerCase() === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAssignReport = (reportId: string, team: string) => {
    console.log(`Assigning report ${reportId} to ${team}`);
    // In a real app, this would update the database
  };

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Unauthorized");
        return;
      }
      // Normalize statuses to backend enum values
      const statusMap: Record<string, string> = {
        pending: "PENDING",
        assigned: "ASSIGNED",
        "in-progress": "IN_PROGRESS",
        in_progress: "IN_PROGRESS",
        resolved: "RESOLVED",
        rejected: "REJECTED",
      };
      const payloadStatus = statusMap[newStatus] || newStatus;

      const res = await fetch(`${API_BASE}/reports/${reportId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: payloadStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setReports((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    } catch (e: any) {
      setError(e.message || "Failed to update status");
    }
  };

  const handleExportReports = async (format: 'csv' | 'json') => {
    try {
      setExporting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE}/export/reports/${format}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export reports");
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `reports_${new Date().toISOString().split('T')[0]}.${format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Failed to export reports");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Reports Management
              </h1>
              <p className="text-muted-foreground">
                Manage and assign civic issue reports
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={exporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? "Exporting..." : "Export Reports"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportReports('csv')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportReports('json')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter & Search Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="roads">Roads</SelectItem>
                    <SelectItem value="water works">Water Works</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="sanitation">Sanitation</SelectItem>
                    <SelectItem value="parks">Parks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <Button variant="outline" className="w-full bg-transparent">
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Reports ({filteredReports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading && <div>Loading...</div>}
              {error && <div className="text-red-600">{error}</div>}
              {filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No reports found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <Card
                    key={report.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(report.status.toLowerCase())}
                            <h3 className="font-semibold text-lg">
                              {report.title}
                            </h3>
                            {report.complaintId && (
                              <Badge variant="outline">
                                #{report.complaintId}
                              </Badge>
                            )}
                          </div>

                          <p className="text-muted-foreground">
                            {report.description}
                          </p>

                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {report.address || "No address"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(report.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              className={getStatusColor(
                                report.status.toLowerCase()
                              )}
                            >
                              {report.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <Badge
                              className={getPriorityColor(
                                report.priority.toLowerCase()
                              )}
                            >
                              {report.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleAssignReport(report.id, "Team A")
                                }
                              >
                                Assign to Team A
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleAssignReport(report.id, "Team B")
                                }
                              >
                                Assign to Team B
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(report.id, "IN_PROGRESS")
                                }
                              >
                                Mark In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(report.id, "RESOLVED")
                                }
                              >
                                Mark Resolved
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
