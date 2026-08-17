"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, UserPlus, Users, Heart, Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

const DEPARTMENTS = [
  "Municipal Corporation - Rohini Zone",
  "Public Works Department",
  "Delhi Jal Board",
  "BSES Rajdhani Power",
  "Delhi Traffic Police",
  "Horticulture & Urban Forestry",
  "Health & Sanitation Dept",
  "General Administration",
];

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<"citizen" | "ngo" | "admin">("citizen");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    organization: "", // For NGO
    serviceArea: "", // For NGO
    department: "Municipal Corporation - Rohini Zone", // For Admin/Official
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      setError("Please enter your name");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate NGO-specific fields
    if (userType === "ngo" && (!formData.organization.trim() || !formData.serviceArea.trim())) {
      setError("Organization Name and Service Area are required for NGO registration");
      setLoading(false);
      return;
    }

    // Validate Official-specific fields
    if (userType === "admin" && !formData.department.trim()) {
      setError("Department is required for official registration");
      setLoading(false);
      return;
    }

    try {
      const role = userType === "admin" ? "ADMIN" : userType === "ngo" ? "NGO" : "CITIZEN";
      const requestBody = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        role,
        ...(userType === "ngo" && {
          organization: formData.organization.trim(),
          serviceArea: formData.serviceArea.trim(),
        }),
        ...(userType === "admin" && {
          department: formData.department.trim(),
        }),
      };

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Registration failed. Please check your details.");
      }

      const data = await res.json();
      const { token, user } = data;

      // Save complete user session in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          address: user.address,
          type: user.role === "ADMIN" ? "admin" : user.role === "NGO" ? "ngo" : "citizen",
          role: user.role,
          department: user.department,
          ngoStatus: user.ngoStatus,
          organization: user.organization,
          serviceArea: user.serviceArea,
        })
      );

      setSuccessMessage("Account created successfully! Redirecting...");

      // Redirect based on role
      const redirectUrl =
        user.role === "ADMIN"
          ? "/admin"
          : user.role === "NGO"
          ? "/ngo/dashboard"
          : "/citizen/dashboard";

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);
    } catch (err: any) {
      setError(err.message || "Something went wrong during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-5">
          <div className="mx-auto mb-3 w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold text-white">JS</span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm">
            Join JanSamvedan to report issues and make a difference
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <Tabs
            value={userType}
            onValueChange={(value) => {
              setUserType(value as "citizen" | "ngo" | "admin");
              setError("");
            }}
          >
            <TabsList className="grid w-full grid-cols-3 mb-5 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger
                value="citizen"
                className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-lg"
              >
                <Users className="h-4 w-4" />
                <span>Citizen</span>
              </TabsTrigger>
              <TabsTrigger
                value="ngo"
                className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-lg"
              >
                <Heart className="h-4 w-4" />
                <span>NGO</span>
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm rounded-lg"
              >
                <Shield className="h-4 w-4" />
                <span>Official</span>
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 py-2.5">
                  <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="border-emerald-200 bg-emerald-50 py-2.5 text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <AlertDescription className="text-emerald-700 text-sm">{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                    {userType === "ngo" ? "Representative Name *" : userType === "admin" ? "Official Name *" : "Full Name *"}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={userType === "ngo" ? "e.g. Amit Choudhary" : userType === "admin" ? "e.g. Er. Rajesh Verma" : "e.g. Vikram Singh"}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className="h-10 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                    {userType === "admin" ? "Official Email *" : "Email Address *"}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={userType === "admin" ? "officer@jansamvedan.org" : "yourname@email.com"}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                    className="h-10 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. 9871200001"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="h-10 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
                    {userType === "admin" ? "Office Location" : "Address / Sector"}
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="e.g. Sector 7, Rohini, Delhi"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, address: e.target.value }))
                    }
                    className="h-10 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                  />
                </div>
              </div>

              {/* Role-Specific Fields for NGO */}
              {userType === "ngo" && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="organization" className="text-xs font-semibold text-purple-900">
                      Organization / NGO Name *
                    </Label>
                    <Input
                      id="organization"
                      type="text"
                      placeholder="e.g. Clean Rohini Foundation"
                      value={formData.organization}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, organization: e.target.value }))
                      }
                      required
                      className="h-10 border-purple-200 bg-white focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="serviceArea" className="text-xs font-semibold text-purple-900">
                      Operational Service Area(s) *
                    </Label>
                    <Input
                      id="serviceArea"
                      type="text"
                      placeholder="e.g. Rohini, Pitampura, Sector 7, Sector 11"
                      value={formData.serviceArea}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, serviceArea: e.target.value }))
                      }
                      required
                      className="h-10 border-purple-200 bg-white focus:border-purple-400"
                    />
                    <p className="text-[11px] text-purple-700">
                      Specify sectors or areas your NGO volunteers actively operate in
                    </p>
                  </div>
                </div>
              )}

              {/* Role-Specific Fields for Municipal Official / Admin */}
              {userType === "admin" && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl space-y-2.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="department" className="text-xs font-semibold text-amber-900">
                      Governing Department *
                    </Label>
                    <Select
                      value={formData.department}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, department: val }))
                      }
                    >
                      <SelectTrigger id="department" className="h-10 border-amber-200 bg-white w-full">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-amber-700">
                      Issues filed for this department will be routed to your management queue
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                    Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                      className="h-10 pr-10 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-0 top-0 h-full px-3 py-2 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                      className="h-10 pr-10 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-0 top-0 h-full px-3 py-2 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 mt-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? "Creating Account..." : `Register as ${userType === "ngo" ? "NGO Partner" : userType === "admin" ? "Department Official" : "Citizen"}`}
              </Button>

              <div className="text-center text-sm text-slate-600 pt-2">
                Already have an account?{" "}
                <Link href="/login" className="text-green-600 hover:text-green-700 font-medium hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
