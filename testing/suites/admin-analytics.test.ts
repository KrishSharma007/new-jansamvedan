import { apiRequest, loginAs, assert, assertEqual, TestResult } from "../utils";

export async function runAdminAnalyticsTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  async function test(name: string, fn: () => Promise<void>) {
    const start = Date.now();
    try {
      await fn();
      results.push({ name, passed: true, durationMs: Date.now() - start });
    } catch (err: any) {
      results.push({
        name,
        passed: false,
        error: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  await test("Admin Overview Analytics (GET /analytics/overview)", async () => {
    const { token } = await loginAs("admin@jansamvedan.org", "password123");
    const res = await apiRequest("GET", "/analytics/overview", { token });
    assert(res.ok, "GET /analytics/overview should succeed for Admin");
    const total = res.data.overview?.totalReports ?? res.data.totalReports;
    assert(typeof total === "number", `totalReports is a number (Got: ${typeof total})`);
    assert(total > 0, "totalReports should be greater than 0");
  });

  await test("Admin Detailed Analytics & Department SLA (GET /analytics/detailed)", async () => {
    const { token } = await loginAs("admin@jansamvedan.org", "password123");
    const res = await apiRequest("GET", "/analytics/detailed", { token });
    assert(res.ok, "GET /analytics/detailed should succeed");
    const deptPerf = res.data.departmentPerformance || res.data.performance || [];
    assert(Array.isArray(deptPerf), "departmentPerformance must be an array");
  });

  await test("Admin NGO Directory Access (GET /auth/ngos)", async () => {
    const { token } = await loginAs("admin@jansamvedan.org", "password123");
    const res = await apiRequest("GET", "/auth/ngos", { token });
    assert(res.ok, "GET /auth/ngos should succeed");
    assert(Array.isArray(res.data), "NGOs list must be an array");
    assert(res.data.length >= 3, `Expected at least 3 NGOs, found ${res.data.length}`);
  });

  await test("Admin Triage: Update Status & Department (PATCH /reports/:id/status)", async () => {
    const { token } = await loginAs("admin@jansamvedan.org", "password123");
    // Get all reports to find one to triage
    const allRes = await apiRequest("GET", "/reports/all", { token });
    assert(allRes.data.length > 0, "Must have reports");
    const targetReport = allRes.data[0];

    const res = await apiRequest("PATCH", `/reports/${targetReport.id}/status`, {
      token,
      body: {
        status: "IN_PROGRESS",
        assignedDept: "Public Works Department",
        comment: "Dispatched zonal repair squad for road repaving.",
      },
    });
    assert(res.ok, `Status update failed: ${res.data?.error || res.status}`);
    const updatedStatus = res.data.report?.status || res.data.status;
    const updatedDept = res.data.report?.assignedDept || res.data.assignedDept;
    assertEqual(updatedStatus, "IN_PROGRESS", "Status should be updated to IN_PROGRESS");
    assertEqual(updatedDept, "Public Works Department", "Assigned department matches");
  });

  await test("Export Reports as CSV (GET /export/reports/csv)", async () => {
    const { token } = await loginAs("admin@jansamvedan.org", "password123");
    const res = await apiRequest("GET", "/export/reports/csv", { token });
    assert(res.ok, "CSV export should succeed");
    assert(typeof res.data === "string", "CSV response should be string data");
    assert(res.data.includes("Complaint ID") || res.data.includes("ID") || res.data.includes("title"), "CSV must include report headers");
  });

  await test("Export GeoJSON for GIS Map Layers (GET /export/map/geojson)", async () => {
    const { token } = await loginAs("admin@jansamvedan.org", "password123");
    const res = await apiRequest("GET", "/export/map/geojson", { token });
    assert(res.ok, "GeoJSON export should succeed");
    assertEqual(res.data.type, "FeatureCollection", "GeoJSON type must be FeatureCollection");
    assert(Array.isArray(res.data.features), "features must be an array");
  });

  return results;
}
