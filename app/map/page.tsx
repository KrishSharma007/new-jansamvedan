"use client";

import { useEffect, useState } from "react";
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
  Search,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  Eye,
  Calendar,
} from "lucide-react";
import { LeafletMapWithMarkers } from "@/components/leaflet-map-with-markers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

type ApiReport = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  reportedDate?: string | null;
  createdAt?: string;
};

const statusToColorClass = (status: string) => {
  switch (status) {
    case "RESOLVED":
      return "bg-green-500";
    case "IN_PROGRESS":
      return "bg-blue-500";
    case "ASSIGNED":
      return "bg-yellow-500";
    case "PENDING":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const priorityToSize = (priority: string) => {
  switch (priority) {
    case "high":
      return 32;
    case "medium":
      return 28;
    case "low":
      return 24;
    default:
      return 28;
  }
};

function closeAnyPopups() {
  document.querySelectorAll(".map-popup").forEach((n) => n.remove());
}

function showPopupForEl(el: HTMLElement, issue: ApiReport) {
  // Popups disabled per request
}

export default function CityMapPage() {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mapView, setMapView] = useState<"normal" | "satellite" | "terrain" | "minimal">("normal");
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<ApiReport | null>(null);
  const [trackReportId, setTrackReportId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    async function loadReports() {
      try {
        const res = await fetch(`${API_BASE}/reports/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load reports");
        const data = (await res.json()) as ApiReport[];
        setReports(data);
      } catch (_) {
        // noop minimal
      } finally {
        setLoading(false);
      }
    }
    loadReports();

    // Check if we're tracking a specific report
    const trackId = localStorage.getItem('trackReportId');
    if (trackId) {
      setTrackReportId(trackId);
      // Clear the tracking ID after reading it
      localStorage.removeItem('trackReportId');
    }
  }, [router]);

  // Filter reports based on current filters
  const filteredReports = reports.filter((r) => {
    // If tracking a specific report, only show that report
    if (trackReportId && r.id !== trackReportId) return false;
    
    // Exclude resolved complaints from city map (unless tracking specific report)
    if (r.status === "RESOLVED" && !trackReportId) return false;

    const cat =
      categoryFilter === "all" ||
      (r.category || "").toLowerCase().includes(categoryFilter);
    const st =
      statusFilter === "all" || r.status === statusFilter.toUpperCase();
    const srch =
      !searchTerm ||
      (r.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.address || "").toLowerCase().includes(searchTerm.toLowerCase());
    return cat && st && srch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RESOLVED": return "#22c55e";
      case "IN_PROGRESS": return "#3b82f6";
      case "ASSIGNED": return "#eab308";
      case "PENDING": return "#ef4444";
      default: return "#6b7280";
    }
  };

  // Convert reports to markers for the map
  const mapMarkers = filteredReports
    .filter(r => r.latitude != null && r.longitude != null)
    .map(r => ({
      id: r.id,
      latitude: r.latitude!,
      longitude: r.longitude!,
      title: r.title,
      category: r.category,
      status: r.status,
      priority: r.priority,
      address: r.address || undefined,
      color: getStatusColor(r.status),
      size: Math.max(24, priorityToSize(r.priority))
    }));

  const handleMarkerClick = (marker: any) => {
    const report = reports.find(r => r.id === marker.id);
    if (report) {
      setSelectedMarker(report);
      // Focus and zoom on the selected issue
      setTrackReportId(report.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      <div className="flex h-screen">
        {/* Enhanced Sidebar */}
        <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-slate-200/60 overflow-y-auto shadow-xl">
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                City Map
              </h1>
              <p className="text-slate-600 text-sm">Explore civic issues across the city</p>
            </div>

            {/* Tracking notification */}
            {trackReportId && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  📍 Tracking specific report. Only this report is shown on the map.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setTrackReportId(null)}
                >
                  Show All Reports
                </Button>
              </div>
            )}

            {/* Enhanced Filters */}
            <div className="space-y-4 mb-6">
              <div className="bg-white/50 rounded-lg p-4 border border-slate-200/50">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search & Filters
                </h3>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by location or issue..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/70 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-2 block">Category</label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="bg-white/70 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="pothole">🕳️ Pothole</SelectItem>
                          <SelectItem value="garbage">🗑️ Garbage</SelectItem>
                          <SelectItem value="street light">💡 Street Light</SelectItem>
                          <SelectItem value="water">💧 Water</SelectItem>
                          <SelectItem value="park">🌳 Park</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-2 block">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-white/70 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="PENDING">🔴 Pending</SelectItem>
                          <SelectItem value="ASSIGNED">🟡 Assigned</SelectItem>
                          <SelectItem value="IN_PROGRESS">🔵 In Progress</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Map View Controls */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Map View
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={mapView === "normal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMapView("normal")}
                    className={`flex-1 transition-all duration-200 ${
                      mapView === "normal" 
                        ? "bg-green-600 hover:bg-green-700 shadow-lg" 
                        : "bg-white/70 hover:bg-white border-slate-200"
                    }`}
                  >
                    <Layers className="h-4 w-4 mr-1" />
                    Normal
                  </Button>
                  <Button
                    variant={mapView === "satellite" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMapView("satellite")}
                    className={`flex-1 transition-all duration-200 ${
                      mapView === "satellite" 
                        ? "bg-green-600 hover:bg-green-700 shadow-lg" 
                        : "bg-white/70 hover:bg-white border-slate-200"
                    }`}
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Satellite
                  </Button>
                  <Button
                    variant={mapView === "terrain" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMapView("terrain")}
                    className={`flex-1 transition-all duration-200 ${
                      mapView === "terrain" 
                        ? "bg-green-600 hover:bg-green-700 shadow-lg" 
                        : "bg-white/70 hover:bg-white border-slate-200"
                    }`}
                  >
                    <ZoomIn className="h-4 w-4 mr-1" />
                    Terrain
                  </Button>
                  <Button
                    variant={mapView === "minimal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMapView("minimal")}
                    className={`flex-1 transition-all duration-200 ${
                      mapView === "minimal" 
                        ? "bg-green-600 hover:bg-green-700 shadow-lg" 
                        : "bg-white/70 hover:bg-white border-slate-200"
                    }`}
                  >
                    <Layers className="h-4 w-4 mr-1" />
                    Minimal
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Issues List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Active Issues
                </h3>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {reports.filter((r) => r.status !== "RESOLVED").length}
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {reports
                  .filter((r) => r.status !== "RESOLVED")
                  .map((issue) => (
                    <Card 
                      key={issue.id} 
                      className={`transition-all duration-200 hover:shadow-md cursor-pointer border-l-4 ${
                        trackReportId === issue.id ? "ring-2 ring-green-500 bg-green-50" :
                        issue.status === "PENDING" ? "border-l-red-400" :
                        issue.status === "ASSIGNED" ? "border-l-yellow-400" :
                        issue.status === "IN_PROGRESS" ? "border-l-blue-400" :
                        "border-l-gray-400"
                      }`}
                      onClick={() => handleMarkerClick({ id: issue.id })}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-4 h-4 rounded-full mt-1 ${
                                issue.status === "PENDING" ? "bg-red-500" :
                                issue.status === "ASSIGNED" ? "bg-yellow-500" :
                                issue.status === "IN_PROGRESS" ? "bg-blue-500" :
                                "bg-gray-500"
                              }`}
                            ></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-medium text-sm text-slate-800 truncate flex-1">
                                {issue.title}
                              </h4>
                              {trackReportId === issue.id && (
                                <Badge className="text-xs bg-green-600 text-white ml-2">
                                  📍 Focused
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 truncate mb-2">
                              {issue.address || "No address provided"}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs bg-slate-100 text-slate-700"
                                >
                                  {issue.category}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    issue.priority === "high" ? "border-red-300 text-red-700" :
                                    issue.priority === "medium" ? "border-yellow-300 text-yellow-700" :
                                    "border-green-300 text-green-700"
                                  }`}
                                >
                                  {issue.priority?.toUpperCase() || "MEDIUM"}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkerClick({ id: issue.id });
                                }}
                              >
                                <Navigation className="h-3 w-3 mr-1" />
                                Focus
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Map Area */}
        <div className="flex-1 relative bg-slate-100">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading map...</p>
              </div>
            </div>
          ) : (
            <div className="relative h-full">
              <LeafletMapWithMarkers
                latitude={28.6139}
                longitude={77.209}
                zoom={12}
                markers={mapMarkers}
                onMarkerClick={handleMarkerClick}
                height="100%"
                className="min-h-[500px]"
                showAttribution={true}
                focusOnMarker={trackReportId || undefined}
                autoFitBounds={!trackReportId && mapMarkers.length > 0}
                mapView={mapView}
                onMapViewChange={(view) => setMapView(view as "normal" | "satellite" | "terrain" | "minimal")}
              />
              
              {/* Map overlay with stats */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200">
                <div className="text-sm text-slate-600">
                  <div className="font-semibold text-slate-800 mb-1">Map Statistics</div>
                  <div>Total Issues: {reports.length}</div>
                  <div>Active Issues: {reports.filter(r => r.status !== "RESOLVED").length}</div>
                  <div>Visible: {mapMarkers.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
