"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  Filter,
  Download,
  Users,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeafletMapWithMarkers } from "@/components/leaflet-map-with-markers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
type ApiReport = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
};

export default function AdminMapPage() {
  const [mapView, setMapView] = useState<"normal" | "satellite" | "terrain" | "minimal">("normal");
  const [timeFilter, setTimeFilter] = useState("today");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    inProgress: number;
    resolvedToday: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<ApiReport | null>(null);
  const [trackReportId, setTrackReportId] = useState<string | null>(null);
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
        const res = await fetch(`${API_BASE}/reports/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load analytics");
        const data = await res.json();
        setStats({
          total: data.totalReports,
          pending: data.pendingReports,
          inProgress: data.inProgressReports,
          resolvedToday: data.resolvedToday,
        });
        // Load reports for map markers
        const repRes = await fetch(`${API_BASE}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (repRes.ok) {
          const repData = await repRes.json();
          setReports(repData);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();

    // Check if we're tracking a specific report
    const trackId = localStorage.getItem('trackReportId');
    if (trackId) {
      setTrackReportId(trackId);
      // Clear the tracking ID after reading it
      localStorage.removeItem('trackReportId');
    }
  }, []);

  // Convert reports to markers for the map
  const mapMarkers = reports
    .filter(r => {
      // If tracking a specific report, only show that report
      if (trackReportId && r.id !== trackReportId) return false;
      return r.latitude != null && r.longitude != null;
    })
    .map(r => ({
      id: r.id,
      latitude: r.latitude!,
      longitude: r.longitude!,
      title: r.title,
      category: r.category,
      status: r.status,
      priority: r.priority,
      address: r.address || undefined,
      color: "#2563eb", // Admin map uses blue for all markers
      size: 16
    }));

  const handleMarkerClick = (marker: any) => {
    const report = reports.find(r => r.id === marker.id);
    if (report) {
      setSelectedMarker(report);
    }
  };

  const handleExportMapData = async (format: 'csv' | 'geojson') => {
    try {
      setExporting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE}/export/map/${format}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export map data");
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `map_data_${new Date().toISOString().split('T')[0]}.${format}`;

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
      setError(err.message || "Failed to export map data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100">
      <div className="flex h-screen">
        {/* Enhanced Admin Sidebar */}
        <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-slate-200/60 overflow-y-auto shadow-xl">
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
                Admin Map View
              </h1>
              <p className="text-slate-600 text-sm">Real-time civic issues monitoring</p>
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

            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {stats?.pending ?? 0}
                  </div>
                  <div className="text-xs font-medium text-red-700">Pending</div>
                  <div className="text-xs text-red-600 mt-1">🔴 Urgent</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {stats?.inProgress ?? 0}
                  </div>
                  <div className="text-xs font-medium text-green-700">In Progress</div>
                  <div className="text-xs text-green-600 mt-1">🔵 Active</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {stats?.resolvedToday ?? 0}
                  </div>
                  <div className="text-xs font-medium text-green-700">Resolved Today</div>
                  <div className="text-xs text-green-600 mt-1">✅ Completed</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-slate-600 mb-1">
                    {stats?.total ?? 0}
                  </div>
                  <div className="text-xs font-medium text-slate-700">Total Issues</div>
                  <div className="text-xs text-slate-600 mt-1">📊 All Time</div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Filters */}
            <div className="space-y-4 mb-6">
              <div className="bg-white/50 rounded-lg p-4 border border-slate-200/50">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters & Controls
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Time Period</label>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger className="bg-white/70 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">📅 Today</SelectItem>
                        <SelectItem value="week">📊 This Week</SelectItem>
                        <SelectItem value="month">📈 This Month</SelectItem>
                        <SelectItem value="quarter">📋 This Quarter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Department</label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="bg-white/70 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="roads">🛣️ Roads</SelectItem>
                        <SelectItem value="water">💧 Water Works</SelectItem>
                        <SelectItem value="electrical">⚡ Electrical</SelectItem>
                        <SelectItem value="sanitation">🗑️ Sanitation</SelectItem>
                        <SelectItem value="parks">🌳 Parks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotspots */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Issue Hotspots
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  No hotspot data available
                </div>
              </CardContent>
            </Card>

            {/* Department Status */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Department Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  No department stats available
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Map View Controls */}
            <div className="space-y-3 mb-6">
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
                      ? "bg-red-600 hover:bg-red-700 shadow-lg" 
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
                      ? "bg-red-600 hover:bg-red-700 shadow-lg" 
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
                      ? "bg-red-600 hover:bg-red-700 shadow-lg" 
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
                      ? "bg-red-600 hover:bg-red-700 shadow-lg" 
                      : "bg-white/70 hover:bg-white border-slate-200"
                  }`}
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Minimal
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full justify-start" size="sm" disabled={exporting}>
                    <Download className="mr-2 h-4 w-4" />
                    {exporting ? "Exporting..." : "Export Map Data"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExportMapData('csv')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportMapData('geojson')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as GeoJSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                size="sm"
              >
                <Filter className="mr-2 h-4 w-4" />
                Advanced Filters
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                size="sm"
              >
                <Clock className="mr-2 h-4 w-4" />
                Schedule Report
              </Button>
            </div>
          </div>
        </div>

        {/* Admin Map Area */}
        <div className="flex-1 relative">
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
        </div>
      </div>
    </div>
  );
}
