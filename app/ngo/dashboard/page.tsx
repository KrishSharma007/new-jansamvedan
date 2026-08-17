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
  AlertTriangle,
  Building2,
  Filter,
  ShieldCheck,
  Compass,
  SlidersHorizontal,
  Sparkles,
  Map,
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
  assignedDept?: string | null;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  distanceMeters?: number | null;
  distanceKm?: number | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

const getStatusColor = (status: string) => {
  switch (status) {
    case "RESOLVED":
      return "bg-green-100 text-green-800 border-green-200";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "ASSIGNED":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "PENDING":
      return "bg-slate-100 text-slate-800 border-slate-200";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high":
    case "urgent":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
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
  const [statusFilter, setStatusFilter] = useState("active");
  const [radiusFilter, setRadiusFilter] = useState<string>("5"); // 2, 5, 10, all
  const [sortBy, setSortBy] = useState<string>("distance"); // distance, priority, confirms, newest
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [helpingReports, setHelpingReports] = useState<Set<string>>(new Set());

  // NGO Status & Service Area states
  const [pendingApproval, setPendingApproval] = useState(false);
  const [serviceArea, setServiceArea] = useState<string>("All Areas");
  const [anchorCoords, setAnchorCoords] = useState<{ lat: number; lng: number; source: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
            lng: position.coords.longitude,
          });
        },
        (err) => console.log("Geolocation error:", err)
      );
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    async function load() {
      try {
        const queryParams = new URLSearchParams();
        if (radiusFilter !== "all") queryParams.append("radius", radiusFilter);
        if (userLocation) {
          queryParams.append("lat", userLocation.lat.toString());
          queryParams.append("lng", userLocation.lng.toString());
        }

        const url = `${API_BASE}/reports/for-ngo${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const res = await fetch(url, {
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
          if (data.anchorCoords) {
            setAnchorCoords(data.anchorCoords);
          }
          const reportList = Array.isArray(data) ? data : data.reports || [];
          setReports(reportList.filter((report: Report) => report.status !== "REJECTED"));
        }

        const helpingRes = await fetch(`${API_BASE}/helpers/ngo/my-helping`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (helpingRes.ok) {
          const helpingData = await helpingRes.json();
          const helpingIds = new Set<string>(helpingData.map((item: any) => item.complaint.id as string));
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
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [radiusFilter, userLocation]);

  const handleWantToHelp = async (reportId: string) => {
    try {
      setActionError(null);
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

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        setActionError(responseData.error || "NGO account must be verified by an administrator to pledge assistance.");
        return;
      }

      setHelpingReports((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyHelping) {
          newSet.delete(reportId);
        } else {
          newSet.add(reportId);
        }
        return newSet;
      });
    } catch (err: any) {
      console.error("Error updating helping status:", err);
      setActionError(err.message || "Failed to update helping status");
    }
  };

  const filteredReports = reports
    .filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.address || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || report.category.toLowerCase() === categoryFilter;

      const matchesPriority =
        priorityFilter === "all" || (report.computedPriority || report.priority).toLowerCase() === priorityFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && report.status !== "RESOLVED") ||
        (statusFilter === "resolved" && report.status === "RESOLVED");

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "distance") {
        const distA = a.distanceMeters ?? 999999;
        const distB = b.distanceMeters ?? 999999;
        return distA - distB;
      }
      if (sortBy === "priority") {
        const pOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const pA = pOrder[(a.computedPriority || a.priority).toLowerCase()] || 0;
        const pB = pOrder[(b.computedPriority || b.priority).toLowerCase()] || 0;
        return pB - pA;
      }
      if (sortBy === "confirms") {
        return (b.confirmationsCount || 0) - (a.confirmationsCount || 0);
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleTrackOnMap = (report: Report) => {
    localStorage.setItem("trackReportId", report.id);
    router.push("/map");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Compass className="h-10 w-10 text-green-600 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Calibrating NGO Radius & GPS Proximity</h3>
          <p className="text-xs text-slate-500">Calculating Haversine distances to local civic reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <Card className="max-w-md p-6 bg-white shadow-xl border-0">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-center font-bold text-slate-800 text-lg">Error Accessing Dashboard</h3>
          <p className="text-center text-xs text-slate-600 mt-1">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Title & GPS Anchor Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                Civic Action Portal
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-green-600" /> GPS Radius Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              NGO Action Dashboard
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
              Target and adopt neighborhood civic issues using live Haversine GPS proximity filtering
            </p>
          </div>

          {!pendingApproval && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-white/90 text-slate-700 border-slate-200 text-xs px-3 py-1.5 shadow-xs flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-purple-600" />
                <span>Area: <strong className="text-slate-900">{serviceArea}</strong></span>
              </Badge>

              {anchorCoords && (
                <Badge variant="outline" className="bg-white/90 text-slate-700 border-slate-200 text-xs px-3 py-1.5 shadow-xs flex items-center gap-1.5">
                  <Compass className="h-4 w-4 text-green-600" />
                  <span>Anchor: <strong className="text-green-700">{anchorCoords.source}</strong> ({anchorCoords.lat.toFixed(3)}°N, {anchorCoords.lng.toFixed(3)}°E)</span>
                </Badge>
              )}
            </div>
          )}
        </div>

        {actionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm text-red-800 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-xs font-semibold text-red-600 hover:text-red-900 underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Pending Approval Banner */}
        {pendingApproval && (
          <Card className="border-0 bg-amber-50 shadow-md rounded-2xl">
            <CardContent className="p-6 flex items-start gap-4">
              <AlertTriangle className="h-7 w-7 text-amber-600 shrink-0 mt-1" />
              <div>
                <h3 className="text-base font-bold text-amber-900 mb-1">
                  Registration Awaiting Administrative Verification
                </h3>
                <p className="text-xs sm:text-sm text-amber-800">
                  Your NGO account is currently in <span className="font-semibold text-amber-950">PENDING</span> status awaiting municipal administration verification. Once approved, you will be able to pledge assistance and action civic reports in your service area.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!pendingApproval && (
          <>
            {/* GPS Radius & Proximity Filter Toolbar */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <CardContent className="p-4 sm:p-5 space-y-4">
                
                {/* Row 1: Search + Radius Pills + Sort */}
                <div className="flex flex-col lg:flex-row gap-3.5 justify-between items-stretch lg:items-center">
                  
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search title, street, landmark, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-10 border-slate-200 rounded-xl text-xs sm:text-sm focus:border-green-400 focus:ring-green-400/20"
                    />
                  </div>

                  {/* GPS Circular Radius Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
                    <span className="text-[11px] font-bold text-slate-500 uppercase px-2 flex items-center gap-1">
                      <Navigation className="h-3 w-3 text-green-600" /> Radius:
                    </span>
                    {(["2", "5", "10", "all"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRadiusFilter(r)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          radiusFilter === r
                            ? "bg-green-600 text-white shadow-xs"
                            : "bg-transparent text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {r === "all" ? "All Zone" : `${r} km`}
                      </button>
                    ))}
                  </div>

                  {/* Sort Selector */}
                  <div className="flex items-center gap-2 w-full lg:w-56 shrink-0">
                    <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs font-medium bg-white">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distance">📍 Closest First (GPS)</SelectItem>
                        <SelectItem value="priority">🔥 Highest Priority</SelectItem>
                        <SelectItem value="confirms">👍 Most Confirms</SelectItem>
                        <SelectItem value="newest">🕒 Newest Reports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Secondary Category & Status Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="pothole">Pothole</SelectItem>
                        <SelectItem value="garbage collection">Garbage Collection</SelectItem>
                        <SelectItem value="street light">Street Light</SelectItem>
                        <SelectItem value="water supply">Water Supply</SelectItem>
                        <SelectItem value="drainage">Drainage</SelectItem>
                        <SelectItem value="encroachment">Encroachment</SelectItem>
                        <SelectItem value="tree hazard">Tree Hazard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Priority</label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High / Urgent Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active Issues (Pending/In Progress)</SelectItem>
                        <SelectItem value="resolved">Resolved / Completed</SelectItem>
                        <SelectItem value="all">All Statuses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.length === 0 ? (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md rounded-2xl">
                  <CardContent className="text-center py-16">
                    <Navigation className="mx-auto h-12 w-12 text-slate-300 mb-3 animate-pulse" />
                    <h3 className="text-base font-bold text-slate-800 mb-1">
                      No Civic Reports Found within {radiusFilter === "all" ? "Zone" : `${radiusFilter} km Radius`}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      Try expanding your GPS radius to 10 km or switching the search/category filters above.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRadiusFilter("all");
                        setCategoryFilter("all");
                        setSearchTerm("");
                      }}
                      className="rounded-xl text-xs h-9 border-slate-200"
                    >
                      Reset Radius to All Zone
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredReports.map((report) => {
                  const isHelping = helpingReports.has(report.id);
                  const isResolved = report.status === "RESOLVED";

                  // Distance display helper
                  let distanceLabel = "Radius Match";
                  let distanceBadgeColor = "bg-slate-100 text-slate-700 border-slate-200";

                  if (report.distanceMeters !== undefined && report.distanceMeters !== null) {
                    if (report.distanceMeters < 1000) {
                      distanceLabel = `📍 ${report.distanceMeters}m away`;
                      distanceBadgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
                    } else {
                      distanceLabel = `📍 ${report.distanceKm} km away`;
                      distanceBadgeColor = report.distanceKm! <= 3
                        ? "bg-teal-100 text-teal-800 border-teal-300 font-bold"
                        : "bg-slate-100 text-slate-700 border-slate-200";
                    }
                  }

                  return (
                    <Card
                      key={report.id}
                      className="bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-200 border-0 shadow-md rounded-2xl overflow-hidden"
                    >
                      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                                {report.title}
                              </CardTitle>
                              {report.complaintId && (
                                <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 border-slate-200 text-slate-600">
                                  #{report.complaintId}
                                </Badge>
                              )}
                              <Badge className={`text-[11px] px-2.5 py-0.5 rounded-lg border ${distanceBadgeColor}`}>
                                {distanceLabel}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                              <MapPin className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              <span className="truncate">{report.address || "Rohini, Delhi"}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap sm:flex-col gap-1.5 items-start sm:items-end shrink-0">
                            <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getStatusColor(report.status)}`}>
                              {report.status.replace("_", " ")}
                            </Badge>
                            {report.assignedDept && (
                              <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-medium">
                                {report.assignedDept.replace("NGO: ", "")}
                              </Badge>
                            )}
                            <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getPriorityColor(report.computedPriority || report.priority)}`}>
                              {(report.computedPriority || report.priority).toUpperCase()} PRIORITY
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="px-5 sm:px-6 pb-5 space-y-3.5">
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-2">
                          {report.description}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span>{new Date(report.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-emerald-800">
                              <span>👍</span>
                              <span>{report.confirmationsCount || 0} Confirms</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTrackOnMap(report)}
                              className="text-xs h-8.5 rounded-xl border-slate-200 hover:bg-slate-100"
                            >
                              <Map className="h-3.5 w-3.5 mr-1 text-teal-600" />
                              Track Map
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(report)}
                              className="text-xs h-8.5 rounded-xl border-slate-200 hover:bg-slate-100"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1 text-slate-600" />
                              Inspect
                            </Button>

                            <Button
                              size="sm"
                              variant={isHelping ? "default" : "outline"}
                              className={`text-xs font-semibold h-8.5 rounded-xl transition-all ${
                                isHelping
                                  ? "bg-green-600 hover:bg-green-700 text-white shadow-xs"
                                  : "border-green-600 text-green-700 hover:bg-green-50"
                              }`}
                              onClick={() => handleWantToHelp(report.id)}
                            >
                              <Heart className={`h-3.5 w-3.5 mr-1 ${isHelping ? "fill-white" : "text-green-600"}`} />
                              {isHelping ? "Pledged Volunteer Support" : "Pledge Support"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <ReportDetailModal
            report={selectedReport}
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedReport(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
