"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  HeartHandshake,
  RefreshCw,
  GitMerge,
  ShieldAlert,
  Layers,
  Trash2,
  Flag,
  MessageSquareX,
} from "lucide-react";
import { ReportDetailModal } from "@/components/report-detail-modal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

type Helper = {
  id: string;
  userId?: string;
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
  assignedDept?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  helpers?: Helper[];
  reportedBy?: { id: string; name: string; email: string };
  spamFlags?: string[];
  flagCount?: number;
  mergedIntoId?: string | null;
};

type DuplicateCluster = {
  masterId: string;
  masterComplaintId: string;
  masterTitle: string;
  category: string;
  totalConfirmations: number;
  reports: Report[];
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

  // Duplicates & Spam state
  const [duplicateClusters, setDuplicateClusters] = useState<DuplicateCluster[]>([]);
  const [spamFlagged, setSpamFlagged] = useState<Report[]>([]);
  const [mergeLoading, setMergeLoading] = useState<string | null>(null);
  const [moderationMessage, setModerationMessage] = useState<string | null>(null);

  // Reject with note state
  const [rejectingReportId, setRejectingReportId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

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
        const [reportsRes, analyticsRes, ngosRes, dupsRes, spamRes] = await Promise.all([
          fetch(`${API_BASE}/reports`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/reports/analytics`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/auth/ngos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/reports/admin/duplicate-clusters`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/reports/admin/spam-flagged`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!reportsRes.ok) throw new Error("Failed to load reports");
        if (!analyticsRes.ok) throw new Error("Failed to load analytics");

        const reportsData = await reportsRes.json();
        const analyticsData = await analyticsRes.json();
        const ngosData = ngosRes.ok ? await ngosRes.json() : [];
        const dupsData = dupsRes.ok ? await dupsRes.json() : [];
        const spamData = spamRes.ok ? await spamRes.json() : [];

        setReports(reportsData);
        setAnalytics(analyticsData);
        setNgos(ngosData);
        setDuplicateClusters(dupsData);
        setSpamFlagged(spamData);
      } catch (e: any) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [router]);

  async function updateStatus(id: string, status: Report["status"], assignedDept?: string, customNotes?: string) {
    try {
      const token = localStorage.getItem("token");
      if (!token) return router.replace("/login");
      const res = await fetch(`${API_BASE}/reports/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          assignedDept,
          notes: customNotes || `Status updated by Admin to ${status}`,
        }),
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

  async function declineNgoHelper(helperId: string) {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/helpers/${helperId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "DECLINED" }),
      });
      if (res.ok) {
        const reportsRes = await fetch(`${API_BASE}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reportsRes.ok) {
          setReports(await reportsRes.json());
        }
      }
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 pt-28 pb-8">
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
          <div className="flex items-center gap-3">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={() => router.push("/admin/ngos")}
            >
              <Building2 className="h-4 w-4 mr-2" /> View NGO Directory & Performance
            </Button>
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
              <TabsList className="bg-white border p-1 rounded-xl flex-wrap">
                <TabsTrigger value="active">Active Reports</TabsTrigger>
                <TabsTrigger value="duplicates" className="relative">
                  <GitMerge className="h-3.5 w-3.5 mr-1" />
                  Duplicates & Spam
                  {(duplicateClusters.length > 0 || spamFlagged.length > 0) && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-bold">
                      {duplicateClusters.length + spamFlagged.length}
                    </span>
                  )}
                </TabsTrigger>
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
                          {report.helpers && report.helpers.length > 0 && (
                            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 flex items-center gap-1 font-semibold">
                              <HeartHandshake className="h-3 w-3 text-emerald-600" />
                              {report.helpers.length} NGO{report.helpers.length > 1 ? "s" : ""} Pledged
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-600 text-sm">{report.description}</p>
                      
                      {report.helpers && report.helpers.length > 0 && (
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                              <HeartHandshake className="h-4 w-4 text-emerald-600" />
                              Pledged NGO Partners ({report.helpers.length}):
                            </div>
                            {report.assignedDept && report.assignedDept.startsWith("NGO:") && (
                              <Badge className="bg-emerald-600 text-white text-[10px]">
                                Currently Assigned
                              </Badge>
                            )}
                          </div>
                          <div className="grid gap-1.5">
                            {report.helpers.filter((h: Helper) => h.status !== "DECLINED").map((h: Helper) => {
                              const orgName = h.user?.organization || h.user?.name || "Verified NGO";
                              const currentAssigned = report.assignedDept || "";
                              const isAssignedToThis = currentAssigned.includes(orgName);
                              const multiAssignedText = currentAssigned
                                ? currentAssigned.includes("NGO:")
                                  ? `${currentAssigned}, ${orgName}`
                                  : `NGO: ${currentAssigned}, ${orgName}`
                                : `NGO: ${orgName}`;

                              return (
                                <div key={h.id || h.userId} className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-100 shadow-2xs">
                                  <div>
                                    <span className="font-semibold text-slate-800">{orgName}</span>
                                    <span className="text-slate-500 text-[11px] ml-2">({h.user?.email})</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {isAssignedToThis ? (
                                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                                        <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" /> Assigned
                                      </Badge>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
                                        onClick={() => updateStatus(report.id, "ASSIGNED", multiAssignedText, `Assigned report to partner NGO ${orgName}`)}
                                      >
                                        Assign
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[11px] border-red-200 text-red-600 hover:bg-red-50"
                                      onClick={() => declineNgoHelper(h.id)}
                                    >
                                      Decline
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setRejectingReportId(rejectingReportId === report.id ? null : report.id);
                              setRejectNote("");
                            }}
                          >
                            <MessageSquareX className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                        {/* Reject With Note Inline Form */}
                        {rejectingReportId === report.id && (
                          <div className="flex items-center gap-2 pt-2 animate-fade-in">
                            <Input
                              placeholder="Reason for rejection (required)..."
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              className="flex-1 h-9 text-sm border-red-200 focus:ring-red-300 focus:border-red-400"
                            />
                            <Button
                              size="sm"
                              disabled={!rejectNote.trim()}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 px-4 disabled:opacity-50"
                              onClick={() => {
                                updateStatus(report.id, "REJECTED", undefined, rejectNote.trim());
                                setRejectingReportId(null);
                                setRejectNote("");
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Confirm Rejection
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* ─── Duplicates & Spam Tab ─── */}
              <TabsContent value="duplicates" className="space-y-6">
                {moderationMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-900 font-medium flex items-center justify-between animate-fade-in">
                    <span>✅ {moderationMessage}</span>
                    <button onClick={() => setModerationMessage(null)} className="text-xs text-emerald-700 underline ml-4">Dismiss</button>
                  </div>
                )}

                {/* Duplicate Clusters Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="h-5 w-5 text-orange-600" />
                    <h2 className="text-xl font-semibold">Detected Duplicate Clusters</h2>
                    <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-300 font-bold">
                      {duplicateClusters.length} Cluster{duplicateClusters.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {duplicateClusters.length === 0 ? (
                    <Card className="border-dashed border-2 border-slate-200">
                      <CardContent className="p-8 text-center text-slate-500">
                        <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
                        <p className="font-semibold text-slate-700">No duplicate clusters detected</p>
                        <p className="text-sm">All active reports are unique based on 200m proximity and category matching.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {duplicateClusters.map((cluster, ci) => (
                        <Card key={ci} className="border-orange-200 bg-orange-50/30 hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                  <Layers className="h-4 w-4 text-orange-600" />
                                  Cluster: {cluster.masterTitle}
                                  <Badge variant="outline" className="font-mono text-xs">#{cluster.masterComplaintId}</Badge>
                                </CardTitle>
                                <p className="text-xs text-slate-500 mt-1">
                                  Category: <strong>{cluster.category}</strong> · {cluster.reports.length} overlapping reports · {cluster.totalConfirmations} total confirms
                                </p>
                              </div>
                              <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                {cluster.reports.length} Reports
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {cluster.reports.map((report: Report, ri: number) => (
                              <div
                                key={report.id}
                                className={`p-3 rounded-xl border text-sm space-y-2 ${
                                  ri === 0
                                    ? "bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/30"
                                    : "bg-white border-slate-200"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      {ri === 0 && (
                                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold">MASTER</Badge>
                                      )}
                                      {ri > 0 && (
                                        <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-700 font-bold">DUPLICATE</Badge>
                                      )}
                                      <span className="font-bold text-slate-900">{report.title}</span>
                                      <Badge variant="outline" className="font-mono text-[10px]">#{report.complaintId}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-2">{report.description}</p>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{report.address || "No address"}</span>
                                      <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{report.confirmationsCount || 0} confirms</span>
                                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(report.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  {ri > 0 && (
                                    <div className="flex gap-2 shrink-0">
                                      <Button
                                        size="sm"
                                        disabled={mergeLoading === report.id}
                                        onClick={async () => {
                                          setMergeLoading(report.id);
                                          try {
                                            const token = localStorage.getItem("token");
                                            const res = await fetch(`${API_BASE}/reports/${report.id}/merge`, {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                              body: JSON.stringify({ masterReportId: cluster.masterId }),
                                            });
                                            if (!res.ok) throw new Error("Merge failed");
                                            const data = await res.json();
                                            setModerationMessage(data.message);
                                            setDuplicateClusters(prev => prev.map(c =>
                                              c.masterId === cluster.masterId
                                                ? { ...c, reports: c.reports.filter(r => r.id !== report.id) }
                                                : c
                                            ).filter(c => c.reports.length >= 2));
                                          } catch (e) { console.error(e); }
                                          setMergeLoading(null);
                                        }}
                                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                                      >
                                        {mergeLoading === report.id ? (
                                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                        ) : (
                                          <GitMerge className="h-3 w-3 mr-1" />
                                        )}
                                        Merge Into Master
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
                                        onClick={() => updateStatus(report.id, "REJECTED", undefined, `Rejected as duplicate of master report #${cluster.masterComplaintId}`)}
                                      >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Spam Flagged Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                    <h2 className="text-xl font-semibold">Spam & Low-Quality Flagged</h2>
                    <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300 font-bold">
                      {spamFlagged.length} Flagged
                    </Badge>
                  </div>

                  {spamFlagged.length === 0 ? (
                    <Card className="border-dashed border-2 border-slate-200">
                      <CardContent className="p-8 text-center text-slate-500">
                        <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
                        <p className="font-semibold text-slate-700">No spam detected</p>
                        <p className="text-sm">All active reports pass automated quality checks.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {spamFlagged.map((report) => (
                        <Card key={report.id} className="border-red-100 hover:shadow-md transition-shadow">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-bold text-slate-900">{report.title}</span>
                                  <Badge variant="outline" className="font-mono text-[10px]">#{report.complaintId}</Badge>
                                  <Badge className={statusBadge(report.status)} >{report.status.replace("_", " ")}</Badge>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2 mb-2">{report.description}</p>

                                {/* Spam Flag Pills */}
                                <div className="flex flex-wrap gap-1.5">
                                  {report.spamFlags?.map((flag, fi) => (
                                    <Badge
                                      key={fi}
                                      variant="outline"
                                      className="bg-red-50 text-red-700 border-red-200 text-[10px] font-semibold flex items-center gap-1"
                                    >
                                      <Flag className="h-3 w-3" />
                                      {flag}
                                    </Badge>
                                  ))}
                                </div>

                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                  {report.reportedBy && (
                                    <span>Reporter: <strong>{report.reportedBy.name}</strong></span>
                                  )}
                                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(report.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setSelectedReport(report); setShowDetailModal(true); }}
                                  className="text-xs"
                                >
                                  Inspect
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs"
                                  onClick={() => {
                                    updateStatus(report.id, "REJECTED", undefined, `Rejected by admin: flagged as spam/low quality (${report.spamFlags?.join(", ")})`);
                                    setSpamFlagged(prev => prev.filter(r => r.id !== report.id));
                                    setModerationMessage(`Report #${report.complaintId} rejected as spam`);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Reject as Spam
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
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
