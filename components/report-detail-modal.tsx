"use client";

import { useState } from "react";
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
import { MapPin, Calendar, Clock, User, FileText, Image as ImageIcon } from "lucide-react";
import { LeafletDisplayMap } from "@/components/leaflet-display-map";

interface Report {
  id: string;
  complaintId?: string;
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
  updatedAt: string;
  reportedBy?: {
    name: string;
    email: string;
  };
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
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusDescription = (status: string) => {
  switch (status) {
    case "PENDING":
      return "Your report has been received and is waiting to be reviewed.";
    case "ASSIGNED":
      return "Your report has been assigned to a department for action.";
    case "IN_PROGRESS":
      return "Work is currently in progress to resolve this issue.";
    case "RESOLVED":
      return "This issue has been successfully resolved.";
    case "REJECTED":
      return "This report was rejected. Please check the reason and resubmit if needed.";
    default:
      return "Status information not available.";
  }
};

export function ReportDetailModal({ report, isOpen, onClose, onTrackOnMap }: ReportDetailModalProps) {
  if (!report) return null;

  const handleTrackOnMap = () => {
    if (onTrackOnMap) {
      onTrackOnMap(report);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Details
          </DialogTitle>
          <DialogDescription>
            Complete information about your civic issue report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{report.title}</h3>
                {report.complaintId && (
                  <p className="text-sm text-muted-foreground">
                    Report ID: #{report.complaintId}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={`${getStatusColor(report.status)} border`}>
                  {report.status.replace("_", " ")}
                </Badge>
                <Badge className={`${getPriorityColor(report.priority)} border`}>
                  {report.priority.toUpperCase()} Priority
                </Badge>
              </div>
            </div>

            {/* Status Description */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  {getStatusDescription(report.status)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </h4>
            <p className="text-muted-foreground">{report.description}</p>
          </div>

          {/* Location Information */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </h4>
            <div className="space-y-3">
              <p className="text-muted-foreground">
                {report.address || "No address provided"}
              </p>
              {report.latitude && report.longitude ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-2 bg-muted/50 border-b">
                      <p className="text-xs text-muted-foreground">
                        📍 Issue location on map
                      </p>
                    </div>
                    <LeafletDisplayMap
                      latitude={report.latitude}
                      longitude={report.longitude}
                      height="200px"
                      markerTitle={report.title}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No location coordinates available
                </p>
              )}
            </div>
          </div>

          {/* Image */}
          {report.imageUrl && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Attached Image
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={report.imageUrl}
                  alt="Report image"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
          )}

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Category</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="outline" className="capitalize">
                  {report.category}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Priority Level</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge className={getPriorityColor(report.priority)}>
                  {report.priority.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Timestamps */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Reported</p>
                  <p className="text-muted-foreground">
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-muted-foreground">
                    {new Date(report.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reporter Information */}
          {report.reportedBy && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Reporter Information
              </h4>
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-1">
                    <p className="font-medium">{report.reportedBy.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.reportedBy.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {report.latitude && report.longitude && onTrackOnMap && (
              <Button onClick={handleTrackOnMap} className="flex-1">
                <MapPin className="h-4 w-4 mr-2" />
                Track on Map
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
