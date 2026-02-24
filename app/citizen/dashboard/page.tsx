"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Eye } from "lucide-react";
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
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
};

function statusBadge(status: Report["status"]) {
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
}

export default function CitizenDashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.replace("/login");

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/reports/me`, {
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
  }, [router]);

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleTrackOnMap = (report: Report) => {
    // Store the report ID in localStorage for the map page to filter by
    localStorage.setItem('trackReportId', report.id);
    router.push('/map');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            My Reports
          </h1>
          <p className="text-muted-foreground">
            Track the status of your submitted civic issues
          </p>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
              <p className="text-muted-foreground mb-4">
                Submit your first report to see it here
              </p>
              <Button onClick={() => router.push("/report")}>
                Report New Issue
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.filter(report => report.status !== "RESOLVED").map((report) => (
              <Card
                key={report.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {report.title}
                        </CardTitle>
                        {report.complaintId && (
                          <Badge variant="outline">#{report.complaintId}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {report.address || "No address provided"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={statusBadge(report.status)}>
                        {report.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="secondary">
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
            ))}
          </div>
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
