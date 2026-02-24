"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

type Helper = {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    organization: string | null;
    serviceArea: string;
  };
};

type Report = {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  address?: string | null;
  createdAt: string;
  helpers?: Helper[];
};

type Analytics = {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedToday: number;
  resolvedReports: number;
  resolutionRate: number;
  avgResolutionTime: string;
  categoryStats: Array<{ category: string; _count: { category: number } }>;
  priorityStats: Array<{ priority: string; _count: { priority: number } }>;
  statusStats: Array<{ status: string; _count: { status: number } }>;
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

export default function AdminDashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const role = user
      ? (JSON.parse(user)?.role as string | undefined)
      : undefined;
    if (!token) return router.replace("/login");
    if (role !== "ADMIN") return router.replace("/");

    async function load() {
      try {
        const [reportsRes, analyticsRes] = await Promise.all([
          fetch(`${API_BASE}/reports`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/reports/analytics`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!reportsRes.ok) throw new Error("Failed to load reports");
        if (!analyticsRes.ok) throw new Error("Failed to load analytics");

        const [reportsData, analyticsData] = await Promise.all([
          reportsRes.json(),
          analyticsRes.json(),
        ]);

        setReports(reportsData);
        setAnalytics(analyticsData);
      } catch (e: any) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function updateStatus(id: string, status: Report["status"]) {
    try {
      const token = localStorage.getItem("token");
      if (!token) return router.replace("/login");
      const res = await fetch(`${API_BASE}/reports/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setReports((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    } catch (e) {
      // no-op minimal UI
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Municipal Administration Portal
          </p>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            {/* Analytics Cards */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Reports
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.totalReports.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All time reports
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pending Reports
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {analytics.pendingReports}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requires immediate attention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Resolved Today
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.resolvedToday}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Great progress today!
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Helpers
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {reports.reduce((total, report) => total + (report.helpers?.length || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      NGOs helping with issues
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Reports Tabs */}
            <Tabs defaultValue="active" className="space-y-4">
              <TabsList>
                <TabsTrigger value="active">Active Reports</TabsTrigger>
                <TabsTrigger value="resolved">Resolved Reports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Active Reports</h2>
                {reports.filter(r => r.status !== "RESOLVED").slice(0, 10).map((report) => (
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
                            <Badge variant="outline">
                              #{report.complaintId}
                            </Badge>
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
                  
                  {/* Helpers Section */}
                  {report.helpers && report.helpers.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Helpers ({report.helpers.length})
                      </h4>
                      <div className="space-y-2">
                        {report.helpers.map((helper) => (
                          <div key={helper.id} className="flex items-center justify-between bg-white p-2 rounded border">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{helper.user.name}</div>
                              <div className="text-xs text-gray-600">
                                {helper.user.organization && `${helper.user.organization} • `}
                                {helper.user.serviceArea}
                              </div>
                              <div className="text-xs text-gray-500">
                                {helper.user.email} • {helper.user.phone || "No phone"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={helper.status === "HELPING" ? "default" : 
                                        helper.status === "CONTACTED" ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                {helper.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`mailto:${helper.user.email}`, '_blank')}
                              >
                                Contact
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
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
                        onClick={() => updateStatus(report.id, "IN_PROGRESS")}
                      >
                        <Clock className="h-4 w-4 mr-1" /> Mark In Progress
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(report.id, "RESOLVED")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Mark Resolved
                      </Button>
                    </div>
                  </div>
                </CardContent>
                </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="resolved" className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Resolved Reports</h2>
                {reports.filter(r => r.status === "RESOLVED").slice(0, 10).map((report) => (
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
                            <Badge variant="outline">
                              #{report.complaintId}
                            </Badge>
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
                          disabled
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Resolved
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
