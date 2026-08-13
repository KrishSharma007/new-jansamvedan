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
import { MapPin, Calendar, Clock, User, FileText, Image as ImageIcon, ThumbsUp, History, ShieldCheck, CheckCircle2 } from "lucide-react";
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
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
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
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackOnMap?: (report: Report) => void;
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

export function ReportDetailModal({ report, isOpen, onClose, onTrackOnMap }: ReportDetailModalProps) {
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

  const handleTrackOnMap = () => {
    if (onTrackOnMap) {
      onTrackOnMap(fullReport);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Report Details & Audit History
          </DialogTitle>
          <DialogDescription>
            Complete information and transparency audit log
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{fullReport.title}</h3>
                {fullReport.complaintId && (
                  <p className="text-sm text-muted-foreground font-mono">
                    ID: #{fullReport.complaintId}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Badge className={`${getStatusColor(fullReport.status)} border text-xs px-2.5 py-1`}>
                  {fullReport.status.replace("_", " ")}
                </Badge>
                <Badge className={`${getPriorityColor(fullReport.computedPriority || fullReport.priority)} border text-xs px-2.5 py-1`}>
                  {(fullReport.computedPriority || fullReport.priority).toUpperCase()} Priority
                </Badge>
              </div>
            </div>
          </div>

          {/* Dynamic Crowd Confirmation & Priority Card */}
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-emerald-950 flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-emerald-600" />
                    Crowd Verification & Priority Signal
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    {fullReport.confirmationsCount || 0} citizens confirmed this issue nearby. Dynamic Priority Score: <span className="font-bold">{fullReport.priorityScore || 0}</span>
                  </p>
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={isConfirming || isReporter || isClosed || hasUserConfirmed}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm"
                >
                  <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
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
                <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {confirmError}
                </p>
              )}
              {confirmSuccess && (
                <p className="text-xs font-medium text-green-700 bg-green-100 p-2 rounded border border-green-300">
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

          {/* Status Audit Trail Timeline */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-slate-800">
              <History className="h-4 w-4 text-slate-600" />
              Status Audit Trail & Lifecycle History
            </h4>
            {fullReport.statusHistory && fullReport.statusHistory.length > 0 ? (
              <div className="space-y-2 relative border-l-2 border-slate-200 ml-3 pl-4 py-1">
                {fullReport.statusHistory.map((hist: any) => (
                  <div key={hist.id} className="relative group">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {hist.oldStatus} ➔ <Badge variant="outline" className="text-[10px]">{hist.newStatus}</Badge>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(hist.createdAt).toLocaleDateString()} {new Date(hist.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600">{hist.notes}</p>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-blue-600" />
                        Changed by: {hist.changedBy?.name || "System"} ({hist.changedByRole})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                Initial report filed. No status changes recorded yet.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
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
