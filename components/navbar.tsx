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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Globe,
  Menu,
  X,
  MapPin,
  Users,
  Shield,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const roleName =
    user?.role ||
    (user?.type === "admin" ? "ADMIN" : user ? "CITIZEN" : undefined);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
  }, []);

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Project Name */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-2 shadow-sm">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                JanSamvedan
              </h1>
              <p className="text-xs text-slate-500">
                Smart India Hackathon
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <div className="flex items-center space-x-2">
                <Badge variant="default">
                  {roleName === "CITIZEN" && (
                    <>
                      <Users className="h-3 w-3 mr-1" />
                      Citizen
                    </>
                  )}
                  {roleName === "ADMIN" && (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </>
                  )}
                  {roleName === "NGO" && (
                    <>
                      <Users className="h-3 w-3 mr-1" />
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
                  href="/admin/reports"
                  className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  Reports
                </Link>
                <Link
                  href="/admin/map"
                  className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  Map View
                </Link>
                <Link
                  href="/admin/analytics"
                  className="text-sm font-medium text-slate-700 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  Analytics
                </Link>
              </div>
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
                    href="/admin/reports"
                    className="block text-sm font-medium text-slate-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                  >
                    Reports
                  </Link>
                  <Link
                    href="/admin/map"
                    className="block text-sm font-medium text-slate-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                  >
                    Map View
                  </Link>
                  <Link
                    href="/admin/analytics"
                    className="block text-sm font-medium text-slate-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                  >
                    Analytics
                  </Link>
                </div>
              )}

              {/* Language Selector */}
              <Select defaultValue="en">
                <SelectTrigger>
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
