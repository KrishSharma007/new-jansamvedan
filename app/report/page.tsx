"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LeafletMap } from "@/components/leaflet-map";
import { compressImage } from "@/utils/imageCompression";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Upload, Send, CheckCircle, Loader2, AlertTriangle, ThumbsUp, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { reverseGeocode, formatCoordinates, isValidCoordinates } from "@/utils/geocoding";
import { ReportDetailModal } from "@/components/report-detail-modal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function ReportIssuePage() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [description, setDescription] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showMap, setShowMap] = useState(false);

  // Duplicate detection state
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [selectedSimilarReport, setSelectedSimilarReport] = useState<any | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // Trigger duplicate check whenever coordinates/address change
  useEffect(() => {
    if (address || (latitude && longitude)) {
      checkDuplicates();
    }
  }, [address, latitude, longitude]);

  const checkDuplicates = async () => {
    setIsCheckingDuplicates(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/reports/find-duplicates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude,
          longitude,
          address,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDuplicates(data || []);
      }
    } catch (err) {
      console.error("Duplicate check error:", err);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const confirmExistingReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/reports/${reportId}/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm report");
      }
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to confirm report");
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file, 512, 0.7);
        setSelectedImage(compressedDataUrl);
      } catch (err) {
        console.error("Failed to compress image:", err);
        setError("Failed to process image. Please try another one.");
      }
    }
  };

  const geocodeLocation = async (lat: number, lng: number) => {
    if (!isValidCoordinates(lat, lng)) {
      setError("Invalid coordinates");
      return;
    }

    setIsGeocoding(true);
    try {
      const result = await reverseGeocode(lat, lng);
      if (result) {
        setAddress(result.address);
        setLocation(formatCoordinates(lat, lng));
      } else {
        setAddress("");
        setLocation(formatCoordinates(lat, lng));
        setError("Could not determine address for this location. Please enter address manually.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setAddress("");
      setLocation(formatCoordinates(lat, lng));
      setError("Could not determine address for this location. Please enter address manually.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const captureLocation = () => {
    setIsCapturingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLatitude(latitude);
          setLongitude(longitude);
          await geocodeLocation(latitude, longitude);
          setIsCapturingLocation(false);
          setShowMap(true);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation("Location access denied");
          setIsCapturingLocation(false);
        }
      );
    } else {
      setLocation("Geolocation not supported");
      setIsCapturingLocation(false);
    }
  };

  const openMapSelector = () => {
    setShowMap(true);
    setError("");
    if (!latitude || !longitude) {
      const defaultLat = 28.6139;
      const defaultLng = 77.209;
      setLatitude(defaultLat);
      setLongitude(defaultLng);
      setLocation(formatCoordinates(defaultLat, defaultLng));
    }
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    await geocodeLocation(lat, lng);
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedImage) {
      setError("Please capture or upload a photo of the issue. AI needs this to determine the category.");
      return;
    }

    if (!latitude || !longitude) {
      setError("Please select a location on the map");
      return;
    }

    if (!address.trim()) {
      setError("Please provide a proper address for the selected location");
      return;
    }

    try {
      setIsAnalyzing(true);
      const token = localStorage.getItem("token");
      if (!token) return router.replace("/login");

      // 1. Upload to Cloudinary via backend helper
      const up = await fetch(`${API_BASE}/uploads/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl: selectedImage,
          folder: "jansamvedan/reports",
          category: "ai-auto",
        }),
      });
      if (!up.ok) {
        const ud = await up.json().catch(() => ({} as any));
        throw new Error(ud.error || "Image upload failed");
      }
      const upRes = await up.json();
      const imageUrl = upRes.url as string;

      // 2. Submit to reports endpoint with dataUrl so backend Ollama can analyze it
      const res = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Civic Issue",
          category: "Other",
          priority: "medium",
          description,
          isAnonymous,
          latitude,
          longitude,
          address,
          imageUrl,
          dataUrl: selectedImage, // Pass base64 for server AI analysis
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(data.error || "Failed to submit report. AI analysis may have timed out.");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="mx-auto bg-green-100 rounded-full p-4 w-fit mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl text-green-700 mb-2">
              Action Confirmed!
            </CardTitle>
            <CardDescription className="text-slate-600">
              Thank you for contributing to crowd verification. Your action helps municipal authorities prioritize urgent civic issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
              <p className="text-sm text-blue-800">
                📱 Track issue status in your dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setDuplicates([]);
                  setDescription("");
                }}
                variant="outline"
                className="flex-1 h-11 border-slate-200 hover:bg-slate-50"
              >
                Report Another Issue
              </Button>
              <Button
                className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                onClick={() => router.push("/my-reports")}
              >
                View My Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28 pb-8 sm:pt-32 sm:pb-12 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
      <div className="absolute -left-40 top-40 h-96 w-96 rounded-full bg-primary/20 blur-[100px] -z-10 opacity-50" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gradient mb-4 tracking-tight">
            Report a Civic Issue
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Help make your community better. Our engine automatically checks for duplicates to boost crowd-priority.
          </p>
        </div>

        <Card className="glass-card border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>
              Please provide details or confirm an existing nearby issue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Duplicate Detection Alert Banner */}
              {duplicates.length > 0 && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <span>Existing Similar Issues Found Nearby!</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    Instead of creating a new ticket, confirm an existing report to boost its crowd priority score!
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {duplicates.map((dup) => (
                      <div
                        key={dup.id}
                        className="p-3 bg-white rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{dup.title} ({dup.complaintId})</div>
                          <div className="text-slate-500">{dup.address || "Nearby location"}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">
                              {dup.confirmationsCount || 0} Confirmations
                            </Badge>
                            <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-800 border-blue-200">
                              Priority: {dup.computedPriority || dup.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSimilarReport(dup)}
                            className="border-amber-300 text-amber-900 hover:bg-amber-100 text-xs whitespace-nowrap"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View Detail
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => confirmExistingReport(dup.id)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs whitespace-nowrap"
                          >
                            <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                            Confirm Issue
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Step 1: Mandatory Photo Evidence */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-emerald-50/50 border-2 border-dashed border-emerald-300 hover:border-emerald-500 transition-colors">
                <div className="flex items-center justify-between">
                  <Label htmlFor="photo" className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    <span>Photo Evidence</span>
                    <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-semibold tracking-wider">
                      Mandatory *
                    </Badge>
                  </Label>
                  <span className="text-xs text-emerald-700 font-medium">Required for Qwen3-VL Vision AI</span>
                </div>

                {selectedImage ? (
                  <div className="space-y-3 pt-2">
                    <div className="relative mx-auto max-w-sm rounded-xl overflow-hidden shadow-md border border-emerald-200">
                      <img
                        src={selectedImage}
                        alt="Selected Civic Issue"
                        className="w-full max-h-56 object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full font-medium">
                        ✓ Photo Attached
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedImage(null)}
                        size="sm"
                        className="text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50"
                      >
                        Retake / Change Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-4 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Camera className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800">
                        Upload or Capture Clear Photo Evidence
                      </p>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Qwen3-VL multimodal AI requires a photo to classify the issue and prevent spam.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="photo-upload" className="cursor-pointer inline-block">
                        <Button type="button" variant="outline" asChild className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50">
                          <span>
                            <Upload className="mr-2 h-4 w-4 text-emerald-600" />
                            Select / Take Photo *
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Location */}
              <div className="space-y-3">
                <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                  Location & Proximity Check *
                </Label>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="location"
                      placeholder="Coordinates will appear when selected on map"
                      value={location}
                      readOnly
                      className="flex-1 h-11 border-slate-200 bg-slate-50"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={captureLocation}
                        disabled={isCapturingLocation}
                        className="flex-1 sm:flex-none h-11 border-slate-200 hover:bg-slate-50"
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{isCapturingLocation ? "GPS..." : "Current Location"}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={openMapSelector}
                        className="flex-1 sm:flex-none h-11 border-slate-200 hover:bg-slate-50"
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>Select on Map</span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                      Address *
                    </Label>
                    <div className="relative">
                      <Input
                        id="address"
                        placeholder="Enter location address or locality"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className="h-11 pr-10 border-slate-200 focus:ring-primary/30 focus:border-primary"
                      />
                      {isGeocoding && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {showMap && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Click anywhere on the map to set location
                        </p>
                      </div>
                      <div className="relative">
                        <LeafletMap
                          latitude={latitude || 28.6139}
                          longitude={longitude || 77.209}
                          onLocationSelect={handleLocationSelect}
                          height="300px"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Description Notes *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue, specific landmarks, or damage details..."
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-slate-200 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>

              {/* Anonymous Reporting Option */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2 transition-all hover:border-slate-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isAnonymous ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"}`}>
                      {isAnonymous ? <EyeOff className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                    </div>
                    <div>
                      <Label htmlFor="anonymous-toggle" className="font-bold text-slate-900 text-sm cursor-pointer">
                        Report Anonymously
                      </Label>
                      <p className="text-xs text-slate-500">
                        {isAnonymous
                          ? "Your identity is completely hidden from admins, NGOs, and the public."
                          : "Your name will be visible to municipal administrators only for status updates."}
                      </p>
                    </div>
                  </div>
                  <input
                    id="anonymous-toggle"
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 space-y-2">
                <Button
                  type="submit"
                  disabled={isAnalyzing || !selectedImage}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Inspecting Photo with Qwen3-VL Vision AI...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Submit Report with Qwen-VL AI
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-center text-slate-500">
                  ⚡ Single-pass Qwen3-VL Vision AI inspects photo authenticity, screens spam & categorizes issue with 0 client load.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Similar Issue Detail Modal */}
      {selectedSimilarReport && (
        <ReportDetailModal
          report={selectedSimilarReport}
          isOpen={!!selectedSimilarReport}
          onClose={() => setSelectedSimilarReport(null)}
          onConfirmReport={(id) => {
            confirmExistingReport(id);
            setSelectedSimilarReport(null);
          }}
        />
      )}
    </div>
  );
}
