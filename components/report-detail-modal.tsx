"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Clock, User, FileText, Image as ImageIcon, ThumbsUp, History, ShieldCheck, CheckCircle2, HeartHandshake, Building2 } from "lucide-react";
import { LeafletDisplayMap } from "@/components/leaflet-display-map";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

interface Report {
  id: string;
  complaintId?: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  computedPriority?: string;
  priorityScore?: number;
  confirmationsCount?: number;
  status: string;
  helpers?: any[];
  assignedDept?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  reportedById?: string;
  reportedBy?: {
    id?: string;
    name: string;
    email: string;
  };
  confirmations?: any[];
  statusHistory?: any[];
}

interface ReportDetailModalProps {
  report: any; // Accept any report type to prevent strict type mismatches between pages
  isOpen: boolean;
  onClose: () => void;
  onTrackOnMap?: (report: any) => void;
  onConfirmReport?: (reportId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "RESOLVED":
      return "bg-green-100 text-green-800 border-green-200";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "ASSIGNED":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "PENDING":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "urgent":
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function ReportDetailModal({ report, isOpen, onClose, onTrackOnMap, onConfirmReport }: ReportDetailModalProps) {
  const [fullReport, setFullReport] = useState<Report | null>(report);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [confirmSuccess, setConfirmSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setFullReport(report);
    setConfirmError("");
    setConfirmSuccess("");
    const stored = localStorage.getItem("user");
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    }

    if (report?.id && isOpen) {
      fetchReportDetails(report.id);
    }
  }, [report, isOpen]);

  const fetchReportDetails = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFullReport(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!fullReport) return null;

  const currentUserId = currentUser?.id || currentUser?.sub;
  const isReporter = fullReport.reportedById === currentUserId || fullReport.reportedBy?.id === currentUserId;
  const isClosed = fullReport.status === "RESOLVED" || fullReport.status === "REJECTED";
  const hasUserConfirmed = fullReport.confirmations?.some((c) => c.userId === currentUserId);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setConfirmError("");
    setConfirmSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/reports/${fullReport.id}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm report");
      }
      setConfirmSuccess("Thank you! Your confirmation has been recorded.");
      fetchReportDetails(fullReport.id);
    } catch (err: any) {
      setConfirmError(err.message || "Failed to confirm report");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleAssignNgo = async (orgName: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/reports/${fullReport.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "ASSIGNED",
          assignedDept: `NGO: ${orgName}`,
          notes: `Report officially assigned to partner NGO ${orgName}`,
        }),
      });
      if (res.ok) {
        fetchReportDetails(fullReport.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrackOnMap = () => {
    if (onTrackOnMap) {
      onTrackOnMap(fullReport);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] border-none glass-card shadow-2xl p-0 flex flex-col overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 border-b border-border/50 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <FileText className="h-6 w-6 text-primary" />
              Report Details & Audit History
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Complete information and transparency audit log
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-8 p-6 overflow-y-auto flex-1">
          {/* Header Information */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-foreground leading-tight">{fullReport.title}</h3>
                {fullReport.complaintId && (
                  <Badge variant="outline" className="text-xs bg-background/50 border-primary/20 text-primary font-mono tracking-wider">
                    ID: #{fullReport.complaintId}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-end shrink-0">
                <Badge className={`${getStatusColor(fullReport.status)} shadow-sm border text-xs px-3 py-1.5`}>
                  {fullReport.status.replace("_", " ")}
                </Badge>
                <Badge className={`${getPriorityColor(fullReport.computedPriority || fullReport.priority)} shadow-sm border text-xs px-3 py-1.5`}>
                  {(fullReport.computedPriority || fullReport.priority).toUpperCase()} Priority
                </Badge>
              </div>
            </div>
          </div>

          {/* Dynamic Crowd Confirmation & Priority Card */}
          <Card className="glass border-l-4 border-l-accent-foreground overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent opacity-50 pointer-events-none" />
            <CardContent className="p-5 space-y-4 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-foreground flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5 text-accent-foreground" />
                    Crowd Verification & Priority Signal
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {fullReport.confirmationsCount || 0} citizens confirmed this issue nearby. Dynamic Priority Score: <span className="font-black text-accent-foreground">{fullReport.priorityScore || 0}</span>
                  </p>
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={isConfirming || isReporter || isClosed || hasUserConfirmed}
                  size="default"
                  className="bg-accent-foreground hover:bg-accent text-background font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {hasUserConfirmed
                    ? "Confirmed"
                    : isReporter
                    ? "Your Report"
                    : isClosed
                    ? "Issue Closed"
                    : "Confirm Issue"}
                </Button>
              </div>

              {confirmError && (
                <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-fade-in">
                  {confirmError}
                </p>
              )}
              {confirmSuccess && (
                <p className="text-sm font-medium text-primary bg-primary/10 p-3 rounded-lg border border-primary/20 animate-fade-in">
                  {confirmSuccess}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2 text-slate-800">
              <FileText className="h-4 w-4 text-slate-600" />
              Description
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {fullReport.description}
            </p>
          </div>

          {/* Location Information */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2 text-slate-800">
              <MapPin className="h-4 w-4 text-slate-600" />
              Location
            </h4>
            <div className="space-y-3">
              <p className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                📍 {fullReport.address || "No address provided"}
              </p>
              {fullReport.latitude && fullReport.longitude ? (
                <div className="space-y-2">
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <LeafletDisplayMap
                      latitude={fullReport.latitude}
                      longitude={fullReport.longitude}
                      height="200px"
                      markerTitle={fullReport.title}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Image */}
          {fullReport.imageUrl && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-slate-800">
                <ImageIcon className="h-4 w-4 text-slate-600" />
                Attached Photo Evidence
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={fullReport.imageUrl}
                  alt="Report image"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
          )}

          {/* Pledged NGO Assistance */}
          {fullReport.helpers && fullReport.helpers.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h4 className="font-bold flex items-center gap-2 text-emerald-800">
                <HeartHandshake className="h-5 w-5 text-emerald-600" />
                Pledged NGO Assistance ({fullReport.helpers.length} Verified Partner{fullReport.helpers.length > 1 ? "s" : ""})
              </h4>
              <div className="grid gap-2">
                {fullReport.helpers.map((helper: any) => {
                  const orgName = helper.user?.organization || helper.user?.name || "Verified NGO Partner";
                  const isAssignedToThis = fullReport.assignedDept === `NGO: ${orgName}`;
                  const isAdmin = currentUser?.role === "ADMIN";

                  return (
                    <div
                      key={helper.id || helper.user?.id}
                      className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between shadow-sm"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                          {orgName}
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-2">
                          <span>Email: {helper.user?.email || "N/A"}</span>
                          {helper.user?.phone && <span>• Phone: {helper.user.phone}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAssignedToThis ? (
                          <Badge className="bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" /> Assigned Partner
                          </Badge>
                        ) : isAdmin ? (
                          <Button
                            size="sm"
                            onClick={() => handleAssignNgo(orgName)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            Assign Issue to NGO
                          </Button>
                        ) : (
                          <Badge className="bg-emerald-600 text-white text-xs">
                            Pledged Helper
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Audit Trail Timeline */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="font-bold flex items-center gap-2 text-foreground">
              <History className="h-5 w-5 text-primary" />
              Status Audit Trail & Lifecycle History
            </h4>
            {fullReport.statusHistory && fullReport.statusHistory.length > 0 ? (
              <div className="space-y-4 relative border-l-2 border-primary/20 ml-3 pl-6 py-2">
                {fullReport.statusHistory.map((hist: any) => (
                  <div key={hist.id} className="relative group">
                    <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-background shadow-[0_0_10px_var(--color-primary)] group-hover:scale-125 transition-transform duration-300" />
                    <div className="glass-card p-4 rounded-xl border border-border/50 shadow-sm text-sm space-y-2 group-hover:shadow-md transition-shadow duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-bold text-foreground flex items-center gap-2 flex-wrap">
                          <span className="text-muted-foreground">{hist.oldStatus.replace("_", " ")}</span>
                          <span className="text-primary">➔</span>
                          <Badge variant="default" className="text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{hist.newStatus.replace("_", " ")}</Badge>
                        </span>
                        <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                          {new Date(hist.createdAt).toLocaleDateString()} {new Date(hist.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{hist.notes}</p>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>
                            Authorized Officer: <strong className="text-foreground font-bold">{hist.changedBy?.name || "Municipal Officer"}</strong>
                          </span>
                          {hist.changedBy?.organization && (
                            <span className="text-xs text-muted-foreground">({hist.changedBy.organization})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[11px] font-mono bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold">
                            Public ID: #{hist.changedBy?.id ? hist.changedBy.id.slice(-8).toUpperCase() : "OFFICER-SYS"}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                            {hist.changedByRole || "ADMIN"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-sm font-medium text-muted-foreground glass rounded-xl border border-border/50 text-center">
                Initial report filed. No status changes recorded yet.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {onConfirmReport && (
              <Button
                onClick={() => onConfirmReport(fullReport.id)}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Confirm This Issue
              </Button>
            )}
            {fullReport.latitude && fullReport.longitude && onTrackOnMap && (
              <Button onClick={handleTrackOnMap} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                <MapPin className="h-4 w-4 mr-2" />
                Track on Map
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
