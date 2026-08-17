"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  Users,
  CheckCircle2,
  TrendingUp,
  Camera,
  Map,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  Navigation,
  ThumbsUp,
  Layers,
  Clock,
  HeartHandshake,
  Activity,
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalReports: 59,
    resolvedReports: 14,
    activeReports: 45,
    resolutionRate: "24%",
  });

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUserRole(parsed.role || (parsed.type === "admin" ? "ADMIN" : parsed.type === "ngo" ? "NGO" : "CITIZEN"));
      }
    } catch (e) {
      setIsLoggedIn(false);
    }

    // Fetch live statistics from backend
    fetch(`${API_BASE}/reports/all`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const total = data.length;
          const resolved = data.filter((r: any) => r.status === "RESOLVED").length;
          const active = total - resolved;
          const rate = total > 0 ? `${Math.round((resolved / total) * 100)}%` : "0%";
          setStats({
            totalReports: total,
            resolvedReports: resolved,
            activeReports: active,
            resolutionRate: rate,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleReportClick = () => {
    router.push(isLoggedIn ? "/report" : "/login");
  };

  const handleMapClick = () => {
    router.push(isLoggedIn ? "/map" : "/login");
  };

  const getDashboardLink = () => {
    if (!isLoggedIn) return "/login";
    if (userRole === "ADMIN") return "/admin/dashboard";
    if (userRole === "NGO") return "/ngo/dashboard";
    return "/citizen/dashboard";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 text-slate-900 selection:bg-emerald-200">
      
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        {/* Decorative Background Blur Circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/50 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-teal-200/40 rounded-full blur-2xl -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Rohini & North Delhi Civic Action Platform</span>
            <Badge variant="outline" className="text-[10px] bg-emerald-100/70 border-emerald-300 text-emerald-800 ml-1 py-0">
              Qwen3-VL Vision AI Active
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight">
            Report, Track & Resolve <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 bg-clip-text text-transparent">
              Civic Issues with AI & GIS
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Empowering citizens, verified NGOs, and municipal authorities (MCD, PWD, DJB, Traffic Police, BSES) to collaborate on real-time neighborhood improvements.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              size="lg"
              className="h-12 px-7 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all"
              onClick={handleReportClick}
            >
              <Camera className="mr-2 h-5 w-5" />
              Report an Issue
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-7 rounded-xl bg-white/80 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 font-semibold shadow-xs transition-all group"
              onClick={handleMapClick}
            >
              <Map className="mr-2 h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              Explore Live GIS Map
              <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Live System Metrics Section */}
      <section className="py-8 relative z-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/90 backdrop-blur-sm border border-emerald-100 shadow-sm rounded-2xl p-4 text-center">
            <div className="mx-auto bg-emerald-100 text-emerald-700 rounded-xl p-2.5 w-fit mb-2">
              <Activity className="h-5 w-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalReports}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Total Civic Issues Logged</div>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-emerald-100 shadow-sm rounded-2xl p-4 text-center">
            <div className="mx-auto bg-green-100 text-green-700 rounded-xl p-2.5 w-fit mb-2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{stats.resolvedReports}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Issues Successfully Resolved</div>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-emerald-100 shadow-sm rounded-2xl p-4 text-center">
            <div className="mx-auto bg-teal-100 text-teal-700 rounded-xl p-2.5 w-fit mb-2">
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-800">{stats.activeReports}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Active In-Progress / Assigned</div>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-emerald-100 shadow-sm rounded-2xl p-4 text-center">
            <div className="mx-auto bg-purple-100 text-purple-700 rounded-xl p-2.5 w-fit mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-900">25+</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Rohini Sectors & Localities</div>
          </Card>
        </div>
      </section>

      {/* How It Works Section (Accurate 3-Step Lifecycle) */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-1 font-semibold mb-2">
            System Workflow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How JanSamvedan Works
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mt-2">
            A transparent, closed-loop civic resolution pipeline from photo intake to on-ground municipal action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-md rounded-2xl hover:shadow-lg transition-all p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="bg-emerald-600 text-white rounded-xl p-3 w-fit mb-4 shadow-sm">
              <Camera className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Step 1</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">Mandatory Photo & AI Intake</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Upload mandatory photographic evidence. Server-side <strong>Qwen3-VL Vision AI</strong> screens for spam, identifies the problem, categorizes the department, and pins GPS coordinates automatically.
            </p>
          </Card>

          {/* Step 2 */}
          <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-md rounded-2xl hover:shadow-lg transition-all p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-100/50 rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="bg-teal-600 text-white rounded-xl p-3 w-fit mb-4 shadow-sm">
              <ThumbsUp className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 2</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">Crowd Upvoting & Deduplication</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Nearby residents confirm the issue with 1-click upvotes. The <strong>Haversine Proximity Engine</strong> clusters duplicate reports within 150m, dynamically boosting ticket priority.
            </p>
          </Card>

          {/* Step 3 */}
          <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-md rounded-2xl hover:shadow-lg transition-all p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100/50 rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="bg-purple-600 text-white rounded-xl p-3 w-fit mb-4 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Step 3</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">Multi-Agency Triage & NGO Action</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Municipal officers assign tasks to specialized agencies (MCD, PWD, DJB, BSES, Traffic Police), while verified NGOs mobilize field volunteers using <strong>Dual-Anchor GPS Radius Filtering</strong>.
            </p>
          </Card>
        </div>
      </section>

      {/* Core Platform Capabilities Section */}
      <section className="py-16 bg-white/70 backdrop-blur-xs border-y border-emerald-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-1 font-semibold mb-2">
              Advanced Engineering
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for Ground-Truth Accountability
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mt-2">
              Every civic report is backed by multimodal AI verification, spatial geometry, and immutable audit logs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <Sparkles className="h-6 w-6 text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Qwen3-VL Vision AI</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Single-pass visual comprehension extracts category, title, priority, and filters out non-civic spam/selfies in sub-second inference.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
              <Map className="h-6 w-6 text-teal-600" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Interactive GIS Mapping</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Leaflet-powered city maps with color-coded status markers, auto-reverse geocoding, and spatial search across Rohini sectors.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <Navigation className="h-6 w-6 text-amber-600" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">NGO Dual Anchor GPS</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Volunteers toggle between Registered Service Area and Live Field GPS to filter civic issues by 2km, 5km, or 10km proximity radius.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
              <Layers className="h-6 w-6 text-purple-600" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">SLA Analytics & Exports</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Departmental resolution turnaround tracking, CSV reports, and GeoJSON export for ArcGIS, QGIS, and urban planning teams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Portal Navigation */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Access Your Portal
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Sign in with your designated role or use our fast demo accounts to explore.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Citizen Card */}
          <Card className="bg-white/90 border border-blue-200 shadow-md rounded-2xl p-6 flex flex-col justify-between hover:border-blue-400 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Citizen Portal</Badge>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Neighborhood Residents</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit photo-verified complaints, upvote local issues, monitor status in real-time, and view resolution history.
              </p>
            </div>
            <Button
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-10"
              onClick={() => router.push(isLoggedIn ? "/citizen/dashboard" : "/login")}
            >
              {isLoggedIn ? "Open Citizen Dashboard" : "Sign In as Citizen"}
            </Button>
          </Card>

          {/* NGO Card */}
          <Card className="bg-white/90 border border-purple-200 shadow-md rounded-2xl p-6 flex flex-col justify-between hover:border-purple-400 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">NGO Action Hub</Badge>
                <HeartHandshake className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Non-Profit Partners</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filter issues within 2–10km of your office or live field GPS, pledge volunteer assistance, and track community impact.
              </p>
            </div>
            <Button
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold h-10"
              onClick={() => router.push(isLoggedIn ? "/ngo/dashboard" : "/login")}
            >
              {isLoggedIn ? "Open NGO Dashboard" : "Sign In as NGO Partner"}
            </Button>
          </Card>

          {/* Municipal Admin Card */}
          <Card className="bg-white/90 border border-amber-200 shadow-md rounded-2xl p-6 flex flex-col justify-between hover:border-amber-400 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Admin Console</Badge>
                <ShieldCheck className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Municipal Administration</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Triage incoming reports, dispatch work orders to PWD/DJB/MCD/Traffic, verify NGO registrations, and inspect SLA metrics.
              </p>
            </div>
            <Button
              className="w-full mt-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold h-10"
              onClick={() => router.push(isLoggedIn ? "/admin/dashboard" : "/login")}
            >
              {isLoggedIn ? "Open Admin Console" : "Sign In as Municipal Admin"}
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white/60 border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-md flex items-center justify-center text-white font-black text-[10px]">
              JS
            </div>
            <span className="font-bold text-slate-800">JanSamvedan</span>
            <span>— AI & GIS Civic Grievance Redressal</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <Link href="/map" className="hover:text-emerald-700 transition-colors">City Map</Link>
            <Link href="/login" className="hover:text-emerald-700 transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-emerald-700 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
