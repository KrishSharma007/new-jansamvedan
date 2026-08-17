"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MapPin,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Calendar,
  Bell,
  BellRing,
} from "lucide-react";
import { ReportDetailModal } from "@/components/report-detail-modal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

type Report = {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "RESOLVED":
      return "bg-green-100 text-green-800";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "ASSIGNED":
      return "bg-yellow-100 text-yellow-800";
    case "PENDING":
      return "bg-gray-100 text-gray-800";
    case "REJECTED":
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

export default function MyReportsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadReports() {
      try {
        const res = await fetch(`${API_BASE}/reports/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load reports");
        const data = await res.json();
        setReports(data);

        // Load citizen notifications
        const notifRes = await fetch(`${API_BASE}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.notifications || []);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
    const interval = setInterval(loadReports, 4000);
    return () => clearInterval(interval);
  }, [router]);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.address || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      report.category.toLowerCase() === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleTrackOnMap = (report: Report) => {
    // Store the report ID in localStorage for the map page to filter by
    localStorage.setItem('trackReportId', report.id);
    router.push('/map');
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8 flex items-center justify-center">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8 flex items-center justify-center text-red-600">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-background pt-28 pb-8 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/10 via-accent/5 to-transparent -z-10" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 animate-fade-in">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-extrabold text-gradient mb-2 tracking-tight">
            My Reports
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Track the status of your submitted civic issues
          </p>
        </div>

        {/* Citizen Notifications Activity Banner */}
        {notifications.length > 0 && (
          <Card className="mb-8 border-l-4 border-l-emerald-500 bg-emerald-50/40 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-emerald-950 flex items-center gap-2">
                <BellRing className="h-5 w-5 text-emerald-600 animate-bounce" />
                Live Status Updates & NGO Pledges ({notifications.filter(n => !n.isRead).length} new)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border text-xs flex justify-between items-start ${
                      !n.isRead
                        ? "bg-white border-emerald-300 font-medium shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{n.title}</span>
                        {!n.isRead && (
                          <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0">New</Badge>
                        )}
                      </div>
                      <p className="text-slate-700 mt-1">{n.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-8 glass-card border-t-4 border-t-accent-foreground">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-foreground flex items-center">
              <Filter className="w-5 h-5 mr-2 text-accent-foreground" />
              Filter Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or location..."
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ASSIGNED">Assigned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved / Completed</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="pothole">Pothole</SelectItem>
                    <SelectItem value="garbage">Garbage</SelectItem>
                    <SelectItem value="street light">Street Light</SelectItem>
                    <SelectItem value="water supply">Water Supply</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ||
                  statusFilter !== "all" ||
                  categoryFilter !== "all"
                    ? "Try adjusting your filters"
                    : "You haven't submitted any reports yet"}
                </p>
                <Button>Report New Issue</Button>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card
                key={report.id}
                className="glass-card hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-primary"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-bold text-foreground">
                          {report.title}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] bg-background/50 border-primary/20 text-primary uppercase font-bold tracking-wider">#{report.id.slice(0,8)}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        <MapPin className="h-4 w-4 text-primary" />
                        {report.address || "No address provided"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${getStatusColor(report.status)} shadow-sm`}>
                        {report.status.replace("_", " ")}
                      </Badge>
                      <Badge className={`${getPriorityColor(report.priority)} shadow-sm`}>
                        {report.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {report.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        Last updated:{" "}
                        {new Date(report.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTrackOnMap(report)}
                        disabled={!report.latitude || !report.longitude}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        Track on Map
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleViewDetails(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-primary">
                {reports.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Reports</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-blue-600">
                {reports.filter((r) => r.status === "IN_PROGRESS").length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-yellow-600">
                {reports.filter((r) => r.status === "PENDING").length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Report Detail Modal */}
        <ReportDetailModal
          report={selectedReport}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReport(null);
          }}
          onTrackOnMap={handleTrackOnMap}
        />
      </div>
    </div>
  );
}
