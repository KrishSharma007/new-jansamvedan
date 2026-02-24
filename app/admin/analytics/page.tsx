"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, Clock, CheckCircle, AlertTriangle, Download, Calendar, Loader2 } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

interface AnalyticsData {
  overview: {
    totalReports: number;
    resolvedReports: number;
    resolutionRate: number;
    avgResolutionTime: number;
    totalUsers: number;
  };
  reportsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  reportsByCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  departmentPerformance: Array<{
    department: string;
    totalReports: number;
    resolutionRate: number;
    avgResponseTime: number;
    performance: string;
  }>;
  monthlyTrends: Array<{
    month: string;
    submitted: number;
    resolved: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE}/analytics/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportAnalytics = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE}/export/analytics/csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export analytics data");
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `analytics_${new Date().toISOString().split('T')[0]}.csv`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Failed to export analytics data");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchAnalyticsData}>Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics & Insights</h1>
              <p className="text-muted-foreground">Performance metrics and trends analysis</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Last 30 Days
              </Button>
              <Button onClick={handleExportAnalytics} disabled={exporting}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Exporting..." : "Export Report"}
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.totalReports.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                All time reports
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.resolutionRate}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {data.overview.resolvedReports} of {data.overview.totalReports} resolved
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.avgResolutionTime} days</div>
              <div className="flex items-center text-xs text-muted-foreground">
                Average time to resolve
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.totalUsers.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                Citizens and NGOs
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Reports by Category</CardTitle>
              <CardDescription>Distribution of issue types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.reportsByCategory.slice(0, 5).map((category, index) => {
                  const colors = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500", "bg-purple-500"];
                  const color = colors[index] || "bg-gray-500";
                  
                  return (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${color} rounded-full`}></div>
                        <span className="text-sm">{category.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${color} h-2 rounded-full`} 
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{category.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Resolution rates and response times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.departmentPerformance.map((dept) => {
                  const getBadgeColor = (performance: string) => {
                    switch (performance) {
                      case "Excellent":
                        return "bg-green-100 text-green-800";
                      case "Good":
                        return "bg-blue-100 text-blue-800";
                      case "Average":
                        return "bg-yellow-100 text-yellow-800";
                      case "Needs Improvement":
                        return "bg-red-100 text-red-800";
                      default:
                        return "bg-gray-100 text-gray-800";
                    }
                  };

                  return (
                    <div key={dept.department} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{dept.department}</h4>
                        <Badge className={getBadgeColor(dept.performance)}>
                          {dept.performance}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Resolution Rate:</span>
                          <div className="font-medium">{dept.resolutionRate}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Response:</span>
                          <div className="font-medium">{dept.avgResponseTime} days</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {dept.totalReports} total reports
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Reports submitted and resolved over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.monthlyTrends.length > 0 ? (
                <div className="space-y-3">
                  {data.monthlyTrends.map((trend) => (
                    <div key={trend.month} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-muted-foreground">
                          {new Date(trend.month + '-01').toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">Submitted: {trend.submitted}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Resolved: {trend.resolved}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trend.submitted > 0 ? Math.round((trend.resolved / trend.submitted) * 100) : 0}% resolved
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No data available for the selected period</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
