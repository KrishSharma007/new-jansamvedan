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
  Users,
  ShieldCheck,
  XCircle,
  Building2,
  ThumbsUp,
} from "lucide-react";
import { ReportDetailModal } from "@/components/report-detail-modal";

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
  computedPriority?: string;
  confirmationsCount?: number;
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  helpers?: Helper[];
};

type NGOUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  serviceArea?: string;
  ngoStatus: "VERIFIED" | "PENDING" | "REJECTED";
  createdAt: string;
};

type Analytics = {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedToday: number;
  resolvedReports: number;
  resolutionRate: number;
  avgResolutionTime: string;
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
  const [ngos, setNgos] = useState<NGOUser[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
        const [reportsRes, analyticsRes, ngosRes] = await Promise.all([
          fetch(`${API_BASE}/reports`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/reports/analytics`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/auth/ngos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!reportsRes.ok) throw new Error("Failed to load reports");
        if (!analyticsRes.ok) throw new Error("Failed to load analytics");

        const reportsData = await reportsRes.json();
        const analyticsData = await analyticsRes.json();
        const ngosData = ngosRes.ok ? await ngosRes.json() : [];

        setReports(reportsData);
        setAnalytics(analyticsData);
        setNgos(ngosData);
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
        body: JSON.stringify({ status, notes: `Status updated by Admin to ${status}` }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      const reportItem = updated.report || updated;
      setReports((prev) =>
        prev.map((r) => (r.id === reportItem.id ? reportItem : r))
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function updateNgoStatus(id: string, ngoStatus: "VERIFIED" | "REJECTED" | "PENDING") {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/auth/ngos/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ngoStatus }),
      });
      if (!res.ok) throw new Error("Failed to update NGO status");
      const updatedNgo = await res.json();
      setNgos((prev) =>
        prev.map((n) => (n.id === updatedNgo.id ? { ...n, ngoStatus: updatedNgo.ngoStatus } : n))
      );
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Municipal Admin Portal
            </h1>
            <p className="text-muted-foreground">
              Oversee civic reports, crowd verification, and NGO registrations
            </p>
          </div>
        </div>

        {loading ? (
          <div>Loading Dashboard...</div>
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
                      All time civic complaints
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
                      Awaiting municipal action
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      NGO Registrations
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                      {ngos.filter((n) => n.ngoStatus === "PENDING").length} Pending
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ngos.filter((n) => n.ngoStatus === "VERIFIED").length} Verified Organizations
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
                      Resolution Rate: {analytics.resolutionRate}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Tabs */}
            <Tabs defaultValue="active" className="space-y-4">
              <TabsList className="bg-white border p-1 rounded-xl">
                <TabsTrigger value="active">Active Reports</TabsTrigger>
                <TabsTrigger value="ngos" className="relative">
                  NGO Verification Approvals
                  {ngos.some((n) => n.ngoStatus === "PENDING") && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                      {ngos.filter((n) => n.ngoStatus === "PENDING").length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="resolved">Resolved Reports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Active Civic Reports</h2>
                {reports.filter(r => r.status !== "RESOLVED").slice(0, 15).map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow border-slate-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{report.title}</CardTitle>
                            <Badge variant="outline" className="font-mono">#{report.complaintId || report.id}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="h-4 w-4" />
                            {report.address || "No address provided"}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 items-end">
                          <Badge className={statusBadge(report.status)}>
                            {report.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="secondary" className="bg-amber-50 text-amber-900 border-amber-200">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {report.confirmationsCount || 0} Confirms • {(report.computedPriority || report.priority).toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-600 text-sm">{report.description}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Reported: {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setShowDetailModal(true);
                            }}
                          >
                            Details & History
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(report.id, "IN_PROGRESS")}
                          >
                            <Clock className="h-4 w-4 mr-1 text-blue-600" /> In Progress
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
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
              
              {/* NGO Approvals Tab */}
              <TabsContent value="ngos" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">NGO Verification Approvals</h2>
                  <p className="text-xs text-slate-500">Review NGO registrations to grant active platform access</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ngos.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-slate-500">
                      No NGO accounts found.
                    </div>
                  ) : (
                    ngos.map((ngo) => (
                      <Card key={ngo.id} className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-emerald-600" />
                                {ngo.organization || ngo.name}
                              </CardTitle>
                              <p className="text-xs text-slate-500">Contact: {ngo.name} ({ngo.email})</p>
                            </div>
                            <Badge
                              className={
                                ngo.ngoStatus === "VERIFIED"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : ngo.ngoStatus === "PENDING"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                              }
                            >
                              {ngo.ngoStatus}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                          <div className="p-2 bg-slate-50 rounded border border-slate-100 space-y-1">
                            <div><span className="font-semibold text-slate-700">Service Area:</span> {ngo.serviceArea || "Not specified"}</div>
                            <div><span className="font-semibold text-slate-700">Phone:</span> {ngo.phone || "N/A"}</div>
                            <div><span className="font-semibold text-slate-700">Applied On:</span> {new Date(ngo.createdAt).toLocaleDateString()}</div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            {ngo.ngoStatus !== "VERIFIED" && (
                              <Button
                                size="sm"
                                onClick={() => updateNgoStatus(ngo.id, "VERIFIED")}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                              >
                                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                Approve NGO
                              </Button>
                            )}
                            {ngo.ngoStatus !== "REJECTED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateNgoStatus(ngo.id, "REJECTED")}
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="resolved" className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Resolved Civic Reports</h2>
                {reports.filter(r => r.status === "RESOLVED").map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow border-slate-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{report.title}</CardTitle>
                            <Badge variant="outline" className="font-mono">#{report.complaintId || report.id}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="h-4 w-4" />
                            {report.address || "No address provided"}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">RESOLVED</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 text-sm mb-3">{report.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowDetailModal(true);
                        }}
                      >
                        View Audit History
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}

        <ReportDetailModal
          report={selectedReport}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReport(null);
          }}
        />
      </div>
    </div>
  );
}
