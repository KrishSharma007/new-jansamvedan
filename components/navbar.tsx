"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Globe,
  Menu,
  X,
  MapPin,
  Users,
  Shield,
  User,
  LogOut,
  Bell,
  Check,
  CheckCheck,
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const roleName =
    user?.role ||
    (user?.type === "admin" ? "ADMIN" : user ? "CITIZEN" : undefined);

  useEffect(() => {
    const userData = localStorage.getItem("token");
    if (userData) {
      const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(parsedUser);
      fetchNotifications();

      const interval = setInterval(() => {
        fetchNotifications();
      }, 8000);

      window.addEventListener("focus", fetchNotifications);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", fetchNotifications);
      };
    }
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      if (!res) return;

      if (res.status === 401) {
        // Expired/invalid session token after database reset
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch {
      // Suppress transient network errors silently during dev server reloads
    }
  };

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      if (res && res.ok) {
        fetchNotifications();
      }
    } catch {
      // Silent catch
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      if (res && res.ok) {
        fetchNotifications();
      }
    } catch {
      // Silent catch
    }
  };

  return (
    <nav className="fixed top-4 inset-x-4 md:inset-x-auto md:w-[90%] md:left-[5%] max-w-7xl z-50 transition-all duration-300">
      <div className={`glass shadow-2xl shadow-primary/5 border border-border/50 transition-all duration-300 overflow-hidden ${isMenuOpen ? 'rounded-2xl' : 'rounded-[2.5rem]'}`}>
        <div className="flex justify-between items-center h-16 px-4 sm:px-6">
          {/* Logo and Project Name */}
          <Link href="/" className="flex items-center space-x-3 group hover:scale-[1.02] transition-all duration-300">
            <div className="bg-gradient-to-br from-primary to-accent-foreground rounded-xl p-2 shadow-sm group-hover:shadow-md transition-all duration-300">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent tracking-tight">
                JanSamvedan
              </h1>
              <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase hidden sm:block">
                Civic Connect
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {user && (
              <div className="flex items-center space-x-2 mr-2">
                <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary">
                  {roleName === "CITIZEN" && (
                    <>
                      <Users className="h-3 w-3 mr-1.5" />
                      Citizen
                    </>
                  )}
                  {roleName === "ADMIN" && (
                    <>
                      <Shield className="h-3 w-3 mr-1.5" />
                      Admin
                    </>
                  )}
                  {roleName === "NGO" && (
                    <>
                      <Users className="h-3 w-3 mr-1.5" />
                      NGO
                    </>
                  )}
                </Badge>
              </div>
            )}

            {user && roleName === "CITIZEN" && (
              <div className="flex items-center space-x-4">
                <Link
                  href="/report"
                  className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  Report Issue
                </Link>
                <Link
                  href="/my-reports"
                  className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  My Reports
                </Link>
                <Link
                  href="/map"
                  className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  City Map
                </Link>
              </div>
            )}

            {user && roleName === "NGO" && (
              <div className="flex items-center space-x-4">
                <Link
                  href="/ngo/dashboard"
                  className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  Dashboard
                </Link>
                <Link
                  href="/map"
                  className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  City Map
                </Link>
              </div>
            )}

            {user && roleName === "ADMIN" && (
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  Dashboard
                </Link>
                <Link
                  href="/map"
                  className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  Map View
                </Link>
              </div>
            )}

            {/* Notification Bell */}
            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-slate-700 hover:bg-slate-100">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 shadow-lg" align="end">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <h4 className="text-sm font-semibold text-slate-800">Notifications</h4>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllRead}
                        className="text-xs text-green-700 hover:text-green-800 h-auto p-0 flex items-center"
                      >
                        <CheckCheck className="h-3 w-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs flex flex-col gap-1 transition-colors ${
                            !n.isRead ? "bg-green-50/50" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{n.title}</span>
                            {!n.isRead && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="text-slate-400 hover:text-green-600 p-0.5"
                                title="Mark read"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-slate-600">{n.message}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Language Selector */}
            <Select defaultValue="en">
              <SelectTrigger className="w-32">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
                <SelectItem value="te">తెలుగు</SelectItem>
                <SelectItem value="ta">தமிழ்</SelectItem>
              </SelectContent>
            </Select>

            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold">
                      {user.name
                        ?.split(" ")
                        .map((n: string) => n[0]?.toUpperCase())
                        .join("")
                        .slice(0, 2) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-700">{user.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-slate-700 hover:text-red-600 hover:bg-red-50"
                >
                  <Link href="/profile" className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Profile
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-slate-700 hover:text-red-600 hover:bg-red-50"
                >
                  <Link href="/signout" className="flex items-center">
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild className="text-slate-700 hover:text-green-600">
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Link href="/signup">Register</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 bg-white/95 backdrop-blur-sm">
            <div className="space-y-4">
              {user && roleName === "CITIZEN" && (
                <div className="space-y-2">
                  <Link
                    href="/report"
                    className="block text-sm font-medium text-slate-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                  >
                    Report Issue
                  </Link>
                  <Link
                    href="/my-reports"
                    className="block text-sm font-medium text-slate-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                  >
                    My Reports
                  </Link>
                  <Link
                    href="/map"
                    className="block text-sm font-medium text-slate-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                  >
                    City Map
                  </Link>
                </div>
              )}

              {user && roleName === "NGO" && (
                <div className="space-y-2">
                  <Link
                    href="/ngo/dashboard"
                    className="block text-sm font-medium text-slate-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/map"
                    className="block text-sm font-medium text-slate-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                  >
                    City Map
                  </Link>
                </div>
              )}

              {user && roleName === "ADMIN" && (
                <div className="space-y-2">
                  <Link
                    href="/admin"
                    className="block text-sm font-medium text-slate-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/map"
                    className="block text-sm font-medium text-slate-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                  >
                    Map View
                  </Link>
                </div>
              )}

              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold">
                        {user.name
                          ?.split(" ")
                          .map((n: string) => n[0]?.toUpperCase())
                          .join("")
                          .slice(0, 2) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-slate-700">{user.name}</span>
                  </div>
                  <Link
                    href="/profile"
                    className="block text-sm font-medium text-slate-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                  >
                    Profile
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                    asChild
                  >
                    <Link href="/signout" className="flex items-center justify-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="ghost" className="flex-1 text-slate-700 hover:text-green-600" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" asChild>
                    <Link href="/signup">Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
