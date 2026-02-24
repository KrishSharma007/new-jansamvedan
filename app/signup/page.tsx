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
import { Eye, EyeOff, UserPlus, Users, Heart } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<"citizen" | "ngo">("citizen");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    organization: "", // For NGO
    serviceArea: "", // For NGO
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    // Validate NGO-specific fields
    if (userType === "ngo" && (!formData.organization || !formData.serviceArea)) {
      setError("Organization and Service Area are required for NGO registration");
      setLoading(false);
      return;
    }

    try {
      const requestBody = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        role: userType === "ngo" ? "NGO" : "CITIZEN",
        ...(userType === "ngo" && {
          organization: formData.organization,
          serviceArea: formData.serviceArea,
        }),
      };

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Signup failed");
      }
      const data = await res.json();
      const { token, user } = data;
      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.role === "ADMIN" ? "admin" : user.role === "NGO" ? "ngo" : "citizen",
          role: user.role,
        })
      );
      
      // Redirect based on user type
      const redirectUrl = user.role === "NGO" ? "/ngo/dashboard" : "/citizen/dashboard";
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-slate-600">
            Join JanSamvedan to report issues and make a difference
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Tabs
            value={userType}
            onValueChange={(value) => setUserType(value as "citizen" | "ngo")}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100">
              <TabsTrigger 
                value="citizen" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Citizen</span>
                <span className="sm:hidden">Citizen</span>
              </TabsTrigger>
              <TabsTrigger 
                value="ngo" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">NGO/Volunteer</span>
                <span className="sm:hidden">NGO</span>
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="h-11 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  className="h-11 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  required
                  className="h-11 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                  Address *
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  required
                  className="h-11 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>

              {userType === "ngo" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="organization" className="text-sm font-medium text-slate-700">
                      Organization Name *
                    </Label>
                    <Input
                      id="organization"
                      type="text"
                      placeholder="Enter your organization name"
                      value={formData.organization}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, organization: e.target.value }))
                      }
                      required
                      className="h-11 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceArea" className="text-sm font-medium text-slate-700">
                      Service Area *
                    </Label>
                    <Input
                      id="serviceArea"
                      type="text"
                      placeholder="e.g., Mumbai, Delhi, Bangalore"
                      value={formData.serviceArea}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, serviceArea: e.target.value }))
                      }
                      required
                      className="h-11 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                    />
                    <p className="text-xs text-slate-500">
                      Specify the geographical area where your organization operates
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                    className="h-11 pr-10 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    required
                    className="h-11 pr-10 border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="mt-6 text-center text-sm text-slate-600">
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
