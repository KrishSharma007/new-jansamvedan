"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LeafletMap } from "@/components/leaflet-map";
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
import { Camera, MapPin, Upload, Send, CheckCircle, Loader2, AlertTriangle, ThumbsUp } from "lucide-react";
import { reverseGeocode, formatCoordinates, isValidCoordinates } from "@/utils/geocoding";

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
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showMap, setShowMap] = useState(false);

  // Duplicate detection state
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // Trigger duplicate check whenever category or coordinates/address change
  useEffect(() => {
    if (category && (address || (latitude && longitude))) {
      checkDuplicates();
    }
  }, [category, address, latitude, longitude]);

  const checkDuplicates = async () => {
    setIsCheckingDuplicates(true);
    try {
      const token = localStorage.getItem("token");
      const categoryMap: Record<string, string> = {
        pothole: "Pothole",
        garbage: "Garbage Collection",
        streetlight: "Street Light",
        water: "Water Supply",
        drainage: "Drainage",
        traffic: "Traffic Signal",
        park: "Park Maintenance",
      };
      const catName = categoryMap[category] || category;

      const res = await fetch(`${API_BASE}/reports/find-duplicates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: catName,
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!latitude || !longitude) {
      setError("Please select a location on the map");
      return;
    }

    if (!address.trim()) {
      setError("Please provide a proper address for the selected location");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return router.replace("/login");

      let imageUrl: string | undefined = undefined;
      if (selectedImage) {
        const up = await fetch(`${API_BASE}/uploads/image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataUrl: selectedImage,
            folder: "jansamvedan/reports",
            category: category || "other",
          }),
        });
        if (!up.ok) {
          const ud = await up.json().catch(() => ({} as any));
          throw new Error(ud.error || "Image upload failed");
        }
        const upRes = await up.json();
        imageUrl = upRes.url as string;
      }

      const categoryMap: Record<string, string> = {
        pothole: "Pothole",
        garbage: "Garbage Collection",
        streetlight: "Street Light",
        water: "Water Supply",
        drainage: "Drainage",
        traffic: "Traffic Signal",
        park: "Park Maintenance",
      };
      const catName = categoryMap[category] || category || "Other";

      const res = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title || `${catName} Issue`,
          description,
          category: catName,
          priority: priority || "medium",
          latitude,
          longitude,
          address,
          imageUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data.error || "Failed to submit report");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
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
                📧 Updates will be sent to your registered account.<br/>
                📱 Track issue status in your dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setDuplicates([]);
                  setTitle("");
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Report a Civic Issue
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Help make your community better by reporting issues. Our crowd-confirmation engine checks for duplicate reports nearby to boost issue priority automatically.
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
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
                        className="p-3 bg-white rounded-lg border border-amber-200 flex items-center justify-between gap-3 text-xs shadow-sm"
                      >
                        <div>
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
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => confirmExistingReport(dup.id)}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs whitespace-nowrap"
                        >
                          <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                          Confirm This Issue
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Category and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Issue Category *
                  </Label>
                  <Select required onValueChange={setCategory}>
                    <SelectTrigger className="h-11 border-slate-200 focus:border-green-400 focus:ring-green-400/20">
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pothole">🕳️ Pothole</SelectItem>
                      <SelectItem value="garbage">🗑️ Garbage Collection</SelectItem>
                      <SelectItem value="streetlight">💡 Street Light</SelectItem>
                      <SelectItem value="water">💧 Water Supply</SelectItem>
                      <SelectItem value="drainage">🌊 Drainage</SelectItem>
                      <SelectItem value="traffic">🚦 Traffic Signal</SelectItem>
                      <SelectItem value="park">🌳 Park Maintenance</SelectItem>
                      <SelectItem value="other">📋 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Initial Priority Preference */}
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium text-slate-700">
                    Initial Priority Level *
                  </Label>
                  <Select required onValueChange={setPriority}>
                    <SelectTrigger className="h-11 border-slate-200 focus:border-green-400 focus:ring-green-400/20">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Minor issue</SelectItem>
                      <SelectItem value="medium">Medium - Moderate impact</SelectItem>
                      <SelectItem value="high">High - Serious concern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Issue Title *
                </Label>
                <Input
                  id="title"
                  placeholder="Brief title (e.g. Deep pothole on Main Road)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-11 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>

              {/* Location */}
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
                        className="h-11 pr-10 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
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

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label htmlFor="photo" className="text-sm font-medium text-slate-700">
                  Photo Evidence (Optional)
                </Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 sm:p-6 text-center hover:border-green-300 transition-colors">
                  {selectedImage ? (
                    <div className="space-y-4">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="mx-auto max-h-32 sm:max-h-48 rounded-lg shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedImage(null)}
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <Camera className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-slate-400" />
                      <div>
                        <Label htmlFor="photo-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" asChild className="bg-white hover:bg-slate-50">
                            <span>
                              <Upload className="mr-2 h-4 w-4" />
                              Choose Photo
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Submit New Ticket
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
