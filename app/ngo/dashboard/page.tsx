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
  Filter,
  Eye,
  Heart,
  Calendar,
  Navigation,
  Users,
  AlertTriangle,
} from "lucide-react";
import { ReportDetailModal } from "@/components/report-detail-modal";

type Report = {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
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

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function NgoDashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [radiusFilter, setRadiusFilter] = useState("all");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [helpingReports, setHelpingReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token) {
      router.replace("/login");
      return;
    }

    // Debug: Check user role
    if (user) {
      const userData = JSON.parse(user);
      console.log("NGO Dashboard - User data:", userData);
      if (userData.role !== "NGO") {
        console.error("User is not an NGO, role:", userData.role);
        setError("Access denied: This page is for NGO users only");
        setLoading(false);
        return;
      }
    }

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }

    async function load() {
      try {
        console.log(
          "Fetching reports for NGO from:",
          `${API_BASE}/reports/for-ngo`
        );
        const res = await fetch(`${API_BASE}/reports/for-ngo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Failed to load reports:", res.status, errorData);
          throw new Error(errorData.error || "Failed to load reports");
        }
        const data = await res.json();
        // Filter out resolved reports from NGO view
        setReports(data.filter((report: Report) => report.status !== "RESOLVED"));

        // Load helping status
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

  // Filter reports based on search, category, priority, and radius
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.address || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory =
      categoryFilter === "all" || report.category.toLowerCase() === categoryFilter;
    
    const matchesPriority =
      priorityFilter === "all" || report.priority.toLowerCase() === priorityFilter;
    
    let matchesRadius = true;
    if (radiusFilter !== "all" && userLocation && report.latitude && report.longitude) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        report.latitude,
        report.longitude
      );
      const radiusKm = parseInt(radiusFilter);
      matchesRadius = distance <= radiusKm;
    }
    
    return matchesSearch && matchesCategory && matchesPriority && matchesRadius;
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
      if (!token) {
        router.replace("/login");
        return;
      }

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

      // Update local state
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
      // You could add a toast notification here
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            NGO Dashboard
          </h1>
          <p className="text-muted-foreground">
            Help resolve civic issues in your area
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="pothole">Pothole</SelectItem>
                    <SelectItem value="garbage">Garbage</SelectItem>
                    <SelectItem value="street light">Street Light</SelectItem>
                    <SelectItem value="water supply">Water Supply</SelectItem>
                    <SelectItem value="park">Park</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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
                <label className="text-sm font-medium">Distance</label>
                <Select value={radiusFilter} onValueChange={setRadiusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Distances</SelectItem>
                    <SelectItem value="1">Within 1 km</SelectItem>
                    <SelectItem value="5">Within 5 km</SelectItem>
                    <SelectItem value="10">Within 10 km</SelectItem>
                    <SelectItem value="25">Within 25 km</SelectItem>
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
                <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || categoryFilter !== "all" || priorityFilter !== "all" || radiusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No active reports in your area"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        {report.complaintId && (
                          <Badge variant="outline">#{report.complaintId}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {report.address || "No address provided"}
                      </div>
                      {userLocation && report.latitude && report.longitude && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Navigation className="h-4 w-4" />
                          {calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            report.latitude,
                            report.longitude
                          ).toFixed(1)} km away
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status.replace("_", " ")}
                      </Badge>
                      <Badge className={getPriorityColor(report.priority)}>
                        {report.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{report.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {report.category}
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
                      <Button
                        variant={helpingReports.has(report.id) ? "default" : "outline"}
                        size="sm"
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-primary">
                {filteredReports.length}
              </div>
              <div className="text-sm text-muted-foreground">Available Reports</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-red-600">
                {filteredReports.filter((r) => r.priority === "high").length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-blue-600">
                {filteredReports.filter((r) => r.status === "PENDING").length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-green-600">
                {helpingReports.size}
              </div>
              <div className="text-sm text-muted-foreground">You're Helping</div>
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
