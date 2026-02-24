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
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  CheckCircle,
  TrendingUp,
  Camera,
  Map,
  Award,
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Report, Track & Resolve Civic Issues Together
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-pretty">
            Empowering citizens to make their communities better through
            technology. Report issues, track progress, and see real change
            happen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8"
              onClick={handleReportClick}
            >
              <Camera className="mr-2 h-5 w-5" />
              Report an Issue
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 bg-transparent"
              onClick={handleMapClick}
            >
              <Map className="mr-2 h-5 w-5" />
              View City Map
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold text-primary">
                  2,847
                </CardTitle>
                <CardDescription>Issues Resolved</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-accent/10 rounded-full p-3 w-fit">
                  <Users className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-3xl font-bold text-accent">
                  15,432
                </CardTitle>
                <CardDescription>Active Citizens</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-secondary/10 rounded-full p-3 w-fit">
                  <TrendingUp className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-3xl font-bold text-secondary">
                  72%
                </CardTitle>
                <CardDescription>Resolution Rate</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple steps to make your community better
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="bg-primary/10 rounded-full p-3 w-fit">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>1. Report Issue</CardTitle>
                <CardDescription>
                  Take a photo, add location, and describe the civic issue
                  you've encountered
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-accent/10 rounded-full p-3 w-fit">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>2. Track Progress</CardTitle>
                <CardDescription>
                  Monitor your report status and see real-time updates from
                  municipal authorities
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-secondary/10 rounded-full p-3 w-fit">
                  <Award className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>3. Earn Rewards</CardTitle>
                <CardDescription>
                  Get recognition for your civic contributions and climb the
                  community leaderboard
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
