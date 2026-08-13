"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Eye,
  Heart,
  Calendar,
  Navigation,
  Users,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { ReportDetailModal } from "@/components/report-detail-modal";

type Report = {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  computedPriority?: string;
  confirmationsCount?: number;
  status: string;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

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
  switch (priority?.toLowerCase()) {
    case "high":
    case "urgent":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function NgoDashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [helpingReports, setHelpingReports] = useState<Set<string>>(new Set());

  // NGO Status & Service Area states
  const [pendingApproval, setPendingApproval] = useState(false);
  const [serviceArea, setServiceArea] = useState<string>("All Areas");
  const [showOnlyServiceArea, setShowOnlyServiceArea] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (user) {
      const userData = JSON.parse(user);
      if (userData.role !== "NGO") {
        setError("Access denied: This page is for registered NGO accounts only");
        setLoading(false);
        return;
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log("Geolocation error:", error)
      );
    }

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/reports/for-ngo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to load reports");
        }
        const data = await res.json();

        if (data.pendingApproval) {
          setPendingApproval(true);
          setReports([]);
        } else {
          setPendingApproval(false);
          setServiceArea(data.serviceArea || "All Areas");
          const reportList = Array.isArray(data) ? data : data.reports || [];
          setReports(reportList.filter((report: Report) => report.status !== "RESOLVED"));
        }

        const helpingRes = await fetch(`${API_BASE}/helpers/ngo/my-helping`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (helpingRes.ok) {
          const helpingData = await helpingRes.json();
          const helpingIds = new Set(helpingData.map((item: any) => item.complaint.id));
          setHelpingReports(helpingIds);
        }
      } catch (e: any) {
        console.error("Error loading reports:", e);
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.address || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory =
      categoryFilter === "all" || report.category.toLowerCase() === categoryFilter;
    
    const matchesPriority =
      priorityFilter === "all" || (report.computedPriority || report.priority).toLowerCase() === priorityFilter;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleTrackOnMap = (report: Report) => {
    localStorage.setItem('trackReportId', report.id);
    router.push('/map');
  };

  const handleWantToHelp = async (reportId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return router.replace("/login");

      const isCurrentlyHelping = helpingReports.has(reportId);
      const action = isCurrentlyHelping ? "remove" : "add";

      const response = await fetch(`${API_BASE}/helpers/${reportId}/help`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update helping status");
      }

      setHelpingReports(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyHelping) {
          newSet.delete(reportId);
        } else {
          newSet.add(reportId);
        }
        return newSet;
      });
    } catch (error) {
      console.error("Error updating helping status:", error);
    }
  };

  if (loading) return <div className="p-6">Loading NGO Portal...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              NGO Action Dashboard
            </h1>
            <p className="text-muted-foreground">
              Partner with municipal authorities to adopt and resolve neighborhood civic issues
            </p>
          </div>

          {!pendingApproval && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-sm px-3 py-1 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Service Area: {serviceArea}
            </Badge>
          )}
        </div>

        {/* Pending Approval Banner */}
        {pendingApproval && (
          <Card className="mb-8 border-2 border-amber-300 bg-amber-50 shadow-md">
            <CardContent className="p-6 flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-amber-900 mb-1">
                  Registration Awaiting Verification
                </h3>
                <p className="text-sm text-amber-800">
                  Your NGO account is currently in <span className="font-semibold text-amber-950">PENDING</span> status awaiting municipal administration verification. Once approved, you will be able to pledge assistance and action civic reports in your service area.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!pendingApproval && (
          <>
            {/* Filters */}
            <Card className="mb-6 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4 text-emerald-600" />
                  Filter Civic Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search Keyword / Address</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by title, location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Issue Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="pothole">Pothole</SelectItem>
                        <SelectItem value="garbage collection">Garbage Collection</SelectItem>
                        <SelectItem value="street light">Street Light</SelectItem>
                        <SelectItem value="water supply">Water Supply</SelectItem>
                        <SelectItem value="drainage">Drainage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority Level</label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
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
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No relevant reports found</h3>
                    <p className="text-muted-foreground mb-4">
                      No active reports match your service area filters at this time.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow border-slate-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{report.title}</CardTitle>
                            {report.complaintId && (
                              <Badge variant="outline" className="font-mono">#{report.complaintId}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="h-4 w-4" />
                            {report.address || "No address provided"}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 items-end">
                          <Badge className={getStatusColor(report.status)}>
                            {report.status.replace("_", " ")}
                          </Badge>
                          <Badge className={getPriorityColor(report.computedPriority || report.priority)}>
                            {(report.computedPriority || report.priority).toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-600 text-sm">{report.description}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 font-semibold text-emerald-800">
                            👍 {report.confirmationsCount || 0} Citizen Confirms
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(report)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant={helpingReports.has(report.id) ? "default" : "outline"}
                            size="sm"
                            className={helpingReports.has(report.id) ? "bg-emerald-600 text-white" : "border-emerald-600 text-emerald-700 hover:bg-emerald-50"}
                            onClick={() => handleWantToHelp(report.id)}
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            {helpingReports.has(report.id) ? "Helping" : "I Want to Help"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-2xl font-bold text-emerald-700">
                    {filteredReports.length}
                  </div>
                  <div className="text-sm text-slate-500">Service Area Reports</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredReports.filter((r) => (r.computedPriority || r.priority) === "high").length}
                  </div>
                  <div className="text-sm text-slate-500">High Priority Issues</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {helpingReports.size}
                  </div>
                  <div className="text-sm text-slate-500">Adopted / Helping Issues</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

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
