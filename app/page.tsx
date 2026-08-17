"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  Users,
  CheckCircle,
  TrendingUp,
  Camera,
  Map,
  Award,
  ArrowRight
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      setIsLoggedIn(!!user);
    } catch (e) {
      setIsLoggedIn(false);
    }
  }, []);

  const handleReportClick = () => {
    router.push(isLoggedIn ? "/report" : "/login");
  };

  const handleMapClick = () => {
    router.push(isLoggedIn ? "/map" : "/login");
  };
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 dark:bg-primary/30 opacity-70 blur-[100px]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary backdrop-blur-md mb-4 hover:bg-primary/10 transition-colors cursor-default">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Empowering Smart Cities
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight text-balance leading-tight">
            Report, Track & Resolve <br className="hidden md:block" />
            <span className="text-gradient">Civic Issues Together</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-pretty font-medium leading-relaxed">
            The premium platform for citizens to report problems, track progress in real-time, and see measurable change in their community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              size="lg"
              className="text-lg px-8 h-14 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300"
              onClick={handleReportClick}
            >
              <Camera className="mr-2 h-5 w-5" />
              Report an Issue
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 h-14 rounded-full bg-background/50 backdrop-blur-sm border-border hover:bg-accent/10 hover:border-accent hover:-translate-y-1 transition-all duration-300 group"
              onClick={handleMapClick}
            >
              <Map className="mr-2 h-5 w-5 text-accent-foreground group-hover:text-primary transition-colors" />
              View City Map
              <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-card text-center hover:scale-[1.02] transition-transform duration-300 border-t-4 border-t-primary">
              <CardHeader className="space-y-4">
                <div className="mx-auto bg-primary/10 rounded-2xl p-4 w-fit shadow-inner">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-4xl font-black text-foreground">
                  2,847
                </CardTitle>
                <CardDescription className="text-base font-medium">Issues Resolved</CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card text-center hover:scale-[1.02] transition-transform duration-300 border-t-4 border-t-accent-foreground">
              <CardHeader className="space-y-4">
                <div className="mx-auto bg-accent-foreground/10 rounded-2xl p-4 w-fit shadow-inner">
                  <Users className="h-8 w-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-4xl font-black text-foreground">
                  15,432
                </CardTitle>
                <CardDescription className="text-base font-medium">Active Citizens</CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card text-center hover:scale-[1.02] transition-transform duration-300 border-t-4 border-t-secondary-foreground">
              <CardHeader className="space-y-4">
                <div className="mx-auto bg-secondary-foreground/10 rounded-2xl p-4 w-fit shadow-inner">
                  <TrendingUp className="h-8 w-8 text-secondary-foreground" />
                </div>
                <CardTitle className="text-4xl font-black text-foreground">
                  72%
                </CardTitle>
                <CardDescription className="text-base font-medium">Resolution Rate</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary/30 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Simple steps to make your community better.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Card className="border-none shadow-none bg-transparent hover:-translate-y-2 transition-transform duration-300">
              <CardHeader className="px-0">
                <div className="bg-primary rounded-2xl p-4 w-fit shadow-lg shadow-primary/30 mb-4">
                  <Camera className="h-7 w-7 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl mb-2">1. Report Issue</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Take a photo, add location, and describe the civic issue
                  you've encountered in seconds.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-none bg-transparent hover:-translate-y-2 transition-transform duration-300">
              <CardHeader className="px-0">
                <div className="bg-accent-foreground rounded-2xl p-4 w-fit shadow-lg shadow-accent-foreground/30 mb-4">
                  <MapPin className="h-7 w-7 text-background" />
                </div>
                <CardTitle className="text-2xl mb-2">2. Track Progress</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Monitor your report status and see real-time updates from
                  municipal authorities and NGOs.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-none bg-transparent hover:-translate-y-2 transition-transform duration-300">
              <CardHeader className="px-0">
                <div className="bg-secondary-foreground rounded-2xl p-4 w-fit shadow-lg shadow-secondary-foreground/30 mb-4">
                  <Award className="h-7 w-7 text-background" />
                </div>
                <CardTitle className="text-2xl mb-2">3. Earn Rewards</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Get recognition for your civic contributions and climb the
                  community leaderboard.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
