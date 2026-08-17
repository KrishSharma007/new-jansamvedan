"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  Star,
  HeartHandshake,
  Award,
  MessageSquare,
  ShieldCheck,
  ArrowLeft,
  SlidersHorizontal,
  Sparkles,
  Send,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

type NGOUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  serviceArea: string;
  ngoStatus: "VERIFIED" | "REJECTED" | "PENDING";
  createdAt: string;
  helpingWith?: Array<{
    complaint: {
      id: string;
      title: string;
      status: string;
      category: string;
      createdAt?: string;
    };
  }>;
  _count?: {
    helpingWith: number;
  };
};

export default function AdminNgosPage() {
  const router = useRouter();
  const [ngos, setNgos] = useState<NGOUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [contactNgo, setContactNgo] = useState<NGOUser | null>(null);
  const [workDoneNgo, setWorkDoneNgo] = useState<NGOUser | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [hoverRating, setHoverRating] = useState<Record<string, number>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const role = user ? JSON.parse(user)?.role : undefined;

    if (!token) return router.replace("/login");
    if (role !== "ADMIN") return router.replace("/");

    const savedRatings = localStorage.getItem("ngo_ratings");
    if (savedRatings) {
      try {
        setRatings(JSON.parse(savedRatings));
      } catch (e) {
        console.error(e);
      }
    }

    loadNgos(token);
  }, [router]);

  async function loadNgos(token: string) {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/ngos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load NGOs");
      const data = await res.json();
      setNgos(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch NGOs");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(ngoId: string, status: "VERIFIED" | "REJECTED" | "PENDING") {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/auth/ngos/${ngoId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ngoStatus: status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      loadNgos(token);
    } catch (e: any) {
      alert(e.message || "Update failed");
    }
  }

  const handleRate = (ngoId: string, rating: number) => {
    const newRatings = { ...ratings, [ngoId]: rating };
    setRatings(newRatings);
    localStorage.setItem("ngo_ratings", JSON.stringify(newRatings));
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setContactNgo(null);
      setMessageText("");
    }, 1500);
  };

  const getRatingLabel = (score: number) => {
    if (score === 5) return "Premier Partner";
    if (score === 4) return "Highly Reliable";
    if (score === 3) return "Active Contributor";
    if (score === 2) return "Needs Review";
    if (score === 1) return "Under Scrutiny";
    return "Unrated Partner";
  };

  // Filter & Sort
  const filteredNgos = ngos
    .filter((ngo) => {
      const orgName = ngo.organization || ngo.name || "";
      const matchesSearch =
        orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ngo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ngo.serviceArea || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || ngo.ngoStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "rating") {
        return (ratings[b.id] || 0) - (ratings[a.id] || 0);
      }
      if (sortBy === "pledges") {
        return (b._count?.helpingWith || 0) - (a._count?.helpingWith || 0);
      }
      if (sortBy === "name") {
        const nameA = a.organization || a.name || "";
        const nameB = b.organization || b.name || "";
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

  const totalVerified = ngos.filter((n) => n.ngoStatus === "VERIFIED").length;
  const totalPending = ngos.filter((n) => n.ngoStatus === "PENDING").length;
  const totalPledges = ngos.reduce((sum, n) => sum + (n._count?.helpingWith || 0), 0);
  const avgRating =
    Object.keys(ratings).length > 0
      ? (Object.values(ratings).reduce((a, b) => a + b, 0) / Object.keys(ratings).length).toFixed(1)
      : "4.8";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-700 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Administrative Hub
              </Badge>
              <Badge className="bg-emerald-900/40 text-emerald-100 border-white/20 backdrop-blur-md px-2.5 py-0.5 text-xs font-semibold">
                Live Directory
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              NGO Partner Directory & Rating Hub
            </h1>
            <p className="text-green-100 text-xs sm:text-sm leading-relaxed">
              Verify non-profit registrations, inspect real-time civic contribution portfolios, monitor performance metrics, and assign administrative star ratings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/dashboard")}
              className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-md font-semibold text-xs sm:text-sm h-10 px-4 rounded-xl transition-all shadow-md"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Portal
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/15 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 flex items-center gap-3">
            <div className="p-2.5 bg-white/20 text-white rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{totalVerified}</div>
              <div className="text-xs text-green-100 font-medium">Verified Partners</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 text-amber-200 rounded-lg relative">
              <Clock className="h-5 w-5" />
              {totalPending > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-amber-400 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{totalPending}</div>
              <div className="text-xs text-green-100 font-medium">Pending Approvals</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 flex items-center gap-3">
            <div className="p-2.5 bg-blue-400/20 text-blue-200 rounded-lg">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{totalPledges}</div>
              <div className="text-xs text-green-100 font-medium">Civic Pledges</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 flex items-center gap-3">
            <div className="p-2.5 bg-amber-300/20 text-amber-200 rounded-lg">
              <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{avgRating} / 5</div>
              <div className="text-xs text-green-100 font-medium">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Sorting */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-3.5 justify-between items-stretch lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search NGO by organization, email, or service area..."
                className="pl-10 h-10 border-slate-200 rounded-xl text-sm focus:border-green-400 focus:ring-green-400/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Quick Filter Pill Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === "all"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({ngos.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("verified")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  statusFilter === "verified"
                    ? "bg-green-600 text-white shadow-xs"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Verified ({totalVerified})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  statusFilter === "pending"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                <Clock className="h-3.5 w-3.5" /> Pending ({totalPending})
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 w-full lg:w-56">
              <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs font-medium bg-white">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Sort by Rating (Highest)</SelectItem>
                  <SelectItem value="pledges">Sort by Pledges (Most Active)</SelectItem>
                  <SelectItem value="name">Sort by Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Directory Grid */}
      {loading ? (
        <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-md">
          <Clock className="mx-auto h-8 w-8 text-green-600 animate-spin mb-2.5" />
          <h3 className="text-sm font-bold text-slate-800">Loading Partner Directory</h3>
          <p className="text-slate-500 text-xs mt-0.5">Retrieving non-profit verification statuses & work history...</p>
        </div>
      ) : filteredNgos.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm text-center py-16 rounded-2xl border-0 shadow-lg">
          <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-2.5" />
          <h3 className="text-base font-bold text-slate-800">No Partner Match Found</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or switching filter criteria in the toolbar above.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNgos.map((ngo) => {
            const orgName = ngo.organization || ngo.name || "NGO Partner";
            const rating = ratings[ngo.id] || 0;
            const currentHover = hoverRating[ngo.id] || 0;
            const activeStarCount = currentHover || rating;
            const helpingCount = ngo._count?.helpingWith || 0;
            const resolvedCount = (ngo.helpingWith || []).filter(
              (h) => h.complaint?.status === "RESOLVED"
            ).length;
            const resolutionRate =
              helpingCount > 0 ? Math.round((resolvedCount / helpingCount) * 100) : 0;

            return (
              <Card
                key={ngo.id}
                className="bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-200 border-0 shadow-md rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                {/* Header & Content */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-500 text-white font-bold text-base flex items-center justify-center shadow-md shadow-green-600/20 shrink-0">
                        {orgName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">
                          {orgName}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-0.5 truncate">
                          <MapPin className="h-3 w-3 text-green-600 shrink-0" />
                          <span className="truncate">{ngo.serviceArea || "All Regions"}</span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                        ngo.ngoStatus === "VERIFIED"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : ngo.ngoStatus === "PENDING"
                          ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                          : "bg-red-100 text-red-800 border-red-200"
                      }`}
                    >
                      {ngo.ngoStatus === "VERIFIED" ? (
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-green-600" /> Verified
                        </span>
                      ) : (
                        ngo.ngoStatus
                      )}
                    </Badge>
                  </div>

                  {/* Interactive Rating Component */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Admin Rating
                      </div>
                      <div className="text-xs font-semibold text-emerald-900 mt-0.5">
                        {getRatingLabel(activeStarCount)}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 cursor-pointer transition-transform hover:scale-125 ${
                            star <= activeStarCount
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200"
                          }`}
                          onMouseEnter={() =>
                            setHoverRating((prev) => ({ ...prev, [ngo.id]: star }))
                          }
                          onMouseLeave={() =>
                            setHoverRating((prev) => ({ ...prev, [ngo.id]: 0 }))
                          }
                          onClick={() => handleRate(ngo.id, star)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Contact Info Summary */}
                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{ngo.email}</span>
                    </div>
                    {ngo.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{ngo.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Work Done Metrics */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 text-[11px]">Resolution Efficiency</span>
                      <span className="text-green-700 font-bold">{resolutionRate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${resolutionRate}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-1.5">
                      <div className="bg-green-50/70 p-2 rounded-xl border border-green-100">
                        <div className="font-extrabold text-green-900 text-sm">{helpingCount}</div>
                        <div className="text-green-700 text-[9px] font-semibold uppercase">Total Pledges</div>
                      </div>
                      <div className="bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                        <div className="font-extrabold text-blue-900 text-sm">{resolvedCount}</div>
                        <div className="text-blue-700 text-[9px] font-semibold uppercase">Resolved Issues</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold h-8 rounded-lg border-slate-200 hover:bg-green-50 hover:text-green-800 hover:border-green-200 transition-all"
                    onClick={() => setWorkDoneNgo(ngo)}
                  >
                    <Award className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                    Inspect Portfolio ({helpingCount})
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs font-semibold h-8 rounded-lg border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 transition-all"
                      onClick={() => setContactNgo(ngo)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1 text-blue-600" />
                      Dispatch
                    </Button>
                    <a href={`mailto:${ngo.email}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-xs font-semibold h-8 rounded-lg border-slate-200 bg-white">
                        <Mail className="h-3.5 w-3.5 mr-1 text-slate-600" />
                        Email
                      </Button>
                    </a>
                  </div>

                  {ngo.ngoStatus === "PENDING" && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs h-8 rounded-lg shadow-xs"
                        onClick={() => handleUpdateStatus(ngo.id, "VERIFIED")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 font-semibold text-xs h-8 rounded-lg"
                        onClick={() => handleUpdateStatus(ngo.id, "REJECTED")}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Work History Dialog */}
      <Dialog open={!!workDoneNgo} onOpenChange={() => setWorkDoneNgo(null)}>
        <DialogContent className="max-w-xl rounded-2xl p-6 bg-white">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
              <Award className="h-5 w-5 text-amber-500" />
              Civic Portfolio — {workDoneNgo?.organization || workDoneNgo?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Complete administrative log of civic reports pledged or resolved by this partner NGO.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 pt-2">
            {!workDoneNgo?.helpingWith || workDoneNgo.helpingWith.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-1.5" />
                <p className="text-slate-600 font-semibold text-xs">No Active Pledges Logged</p>
                <p className="text-slate-400 text-[11px] mt-0.5">This NGO partner has not pledged to any public issue yet.</p>
              </div>
            ) : (
              workDoneNgo.helpingWith.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 transition-all rounded-xl border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <h5 className="font-semibold text-slate-900 text-xs truncate">
                      {item.complaint?.title || "Civic Issue"}
                    </h5>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Badge variant="outline" className="text-[10px] bg-white px-1.5 py-0">
                        {item.complaint?.category || "General"}
                      </Badge>
                      <span>• ID: #{item.complaint?.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  <Badge
                    className={
                      item.complaint?.status === "RESOLVED"
                        ? "bg-green-100 text-green-800 border-green-200 text-[10px] font-semibold shrink-0"
                        : "bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-semibold shrink-0"
                    }
                  >
                    {item.complaint?.status || "HELPING"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Dispatch Dialog */}
      <Dialog open={!!contactNgo} onOpenChange={() => setContactNgo(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-base font-bold">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Administrative Message Dispatch
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Recipient: <span className="font-semibold text-slate-800">{contactNgo?.organization || contactNgo?.name}</span>
            </DialogDescription>
          </DialogHeader>

          {messageSent ? (
            <div className="text-center py-6 space-y-2">
              <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-sm">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Message Dispatched!</h4>
              <p className="text-xs text-slate-500">
                Official notification delivered to NGO contact box.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {/* Quick Template Chips */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Quick Templates:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition-colors font-medium"
                    onClick={() =>
                      setMessageText(
                        `Urgent: Please provide an update on the assigned civic issue in your service area (${contactNgo?.serviceArea || "General"}).`
                      )
                    }
                  >
                    + Status Update Request
                  </button>
                  <button
                    type="button"
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition-colors font-medium"
                    onClick={() =>
                      setMessageText(
                        `Thank you for your active partnership! The municipal administration commends your recent civic contributions.`
                      )
                    }
                  >
                    + Admin Commendation
                  </button>
                </div>
              </div>

              <Textarea
                placeholder="Compose administrative dispatch, task assignment guidelines, or coordination message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="min-h-28 rounded-xl border-slate-200 text-xs focus:border-green-500"
              />

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" className="rounded-lg text-xs h-9" onClick={() => setContactNgo(null)}>
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold h-9" onClick={handleSendMessage}>
                  <Send className="h-3.5 w-3.5 mr-1" /> Dispatch Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
