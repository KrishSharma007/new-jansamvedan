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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const performLogin = async (email: string, pass: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
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
          phone: user.phone,
          address: user.address,
          type:
            user.role === "ADMIN"
              ? "admin"
              : user.role === "NGO"
              ? "ngo"
              : "citizen",
          role: user.role,
          department: user.department,
          ngoStatus: user.ngoStatus,
          organization: user.organization,
          serviceArea: user.serviceArea,
        })
      );

      const redirectUrl =
        user.role === "ADMIN"
          ? "/admin"
          : user.role === "NGO"
          ? "/ngo/dashboard"
          : "/citizen/dashboard";

      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(formData.email, formData.password);
  };

  const handleDemoLogin = (role: "citizen" | "admin" | "ngo") => {
    if (role === "citizen") performLogin("vikram@gmail.com", "password123");
    if (role === "admin") performLogin("admin@jansamvedan.org", "password123");
    if (role === "ngo") performLogin("amit@cleanrohini.org", "password123");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">JS</span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-slate-600">
            Sign in to access JanSamvedan
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
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
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-sm text-center text-slate-500 mb-3 font-medium uppercase tracking-wider">Fast Demo Logins</p>
            <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
              <Button type="button" variant="outline" onClick={() => handleDemoLogin("citizen")} className="flex-1 h-12 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-sm flex flex-col gap-0">
                <span className="text-sm font-semibold">👤 Citizen</span>
                <span className="text-[10px] font-mono opacity-70">vikram@gmail.com</span>
              </Button>
              <Button type="button" variant="outline" onClick={() => handleDemoLogin("admin")} className="flex-1 h-12 bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-sm flex flex-col gap-0">
                <span className="text-sm font-semibold">🛡️ Admin</span>
                <span className="text-[10px] font-mono opacity-70">admin@jansamvedan.org</span>
              </Button>
              <Button type="button" variant="outline" onClick={() => handleDemoLogin("ngo")} className="flex-1 h-12 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 shadow-sm flex flex-col gap-0">
                <span className="text-sm font-semibold">🏢 NGO</span>
                <span className="text-[10px] font-mono opacity-70">amit@cleanrohini.org</span>
              </Button>
            </div>
            <details className="group">
              <summary className="text-[11px] text-center text-slate-400 cursor-pointer hover:text-slate-600 select-none list-none flex items-center justify-center gap-1">
                <span className="group-open:hidden">▸ All demo accounts (password: password123)</span>
                <span className="hidden group-open:inline">▾ Hide accounts</span>
              </summary>
              <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] font-mono text-slate-600 space-y-1">
                <div className="text-[10px] font-sans font-bold text-slate-400 uppercase mb-1.5">Citizens</div>
                <div>vikram@gmail.com</div>
                <div>neha.gupta@yahoo.com</div>
                <div className="text-[10px] font-sans font-bold text-slate-400 uppercase mt-2 mb-1.5">Admins</div>
                <div>admin@jansamvedan.org <span className="text-slate-400">(MCD)</span></div>
                <div>sunita.admin@jansamvedan.org <span className="text-slate-400">(PWD)</span></div>
                <div>anil.djb@jansamvedan.org <span className="text-slate-400">(DJB)</span></div>
                <div>manoj.traffic@jansamvedan.org <span className="text-slate-400">(Traffic)</span></div>
                <div>geeta.bses@jansamvedan.org <span className="text-slate-400">(BSES)</span></div>
                <div className="text-[10px] font-sans font-bold text-slate-400 uppercase mt-2 mb-1.5">NGOs (Verified)</div>
                <div>amit@cleanrohini.org</div>
                <div>priya@greendelhi.org</div>
                <div>suresh@roadsavers.org</div>
                <div>tarun@pitampurahelps.org</div>
                <div>kavya@shalimarbag.org</div>
                <div className="text-[10px] font-sans font-bold text-slate-400 uppercase mt-2 mb-1.5">NGOs (Pending)</div>
                <div>deepak@youthaid.in</div>
              </div>
            </details>
          </div>

          <div className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-green-600 hover:text-green-700 font-medium hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
