import { apiRequest, loginAs, assert, assertEqual, TestResult } from "../utils";

export async function runNgoGpsTests(): Promise<TestResult[]> {
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

  let sampleReportId: string | null = null;

  await test("NGO Endpoint Registered Office Anchor (GET /reports/for-ngo?anchorMode=service)", async () => {
    const { token } = await loginAs("amit@cleanrohini.org", "password123");
    const res = await apiRequest("GET", "/reports/for-ngo?anchorMode=service", { token });
    assert(res.ok, "GET /reports/for-ngo should succeed for verified NGO");
    assertEqual(res.data.pendingApproval, false, "Verified NGO should not be pending");
    assertEqual(res.data.anchorMode, "service", "Anchor mode matches service");
    assert(!!res.data.anchorCoords, "Response must include anchorCoords object");
    assert(typeof res.data.anchorCoords.lat === "number", "Anchor latitude must be a number");
    assert(typeof res.data.anchorCoords.lng === "number", "Anchor longitude must be a number");

    const reports = res.data.reports;
    assert(Array.isArray(reports), "Reports list must be an array");
    assert(reports.length > 0, "Should have reports in NGO service zone");

    // Check distance fields
    const withDistance = reports.filter((r: any) => r.distanceKm !== null && r.distanceKm !== undefined);
    assert(withDistance.length > 0, "Reports must have calculated distanceKm");
    assert(typeof withDistance[0].distanceMeters === "number", "distanceMeters must be number");
    sampleReportId = reports[0].id;
  });

  await test("NGO Endpoint Live GPS Anchor (GET /reports/for-ngo?anchorMode=live&lat=28.7050&lng=77.1180)", async () => {
    const { token } = await loginAs("amit@cleanrohini.org", "password123");
    const res = await apiRequest("GET", "/reports/for-ngo?anchorMode=live&lat=28.7050&lng=77.1180", { token });
    assert(res.ok, "Live GPS query should succeed");
    assertEqual(res.data.anchorMode, "live", "Anchor mode is live");
    assertEqual(res.data.anchorCoords.lat, 28.705, "Anchor lat matches passed coordinate");
    assertEqual(res.data.anchorCoords.lng, 77.118, "Anchor lng matches passed coordinate");
    assert(res.data.anchorCoords.source.includes("Live Field GPS"), "Anchor source identifies Live GPS");
  });

  await test("GPS Radius Filter Enforcement (GET /reports/for-ngo?radius=2)", async () => {
    const { token } = await loginAs("amit@cleanrohini.org", "password123");
    const res = await apiRequest("GET", "/reports/for-ngo?radius=2", { token });
    assert(res.ok, "Radius query should succeed");
    const reports = res.data.reports || [];
    
    // Verify that every report with coordinates is within 2 km
    for (const r of reports) {
      if (r.distanceKm !== null && r.distanceKm !== undefined) {
        assert(
          r.distanceKm <= 2.0,
          `Report #${r.complaintId} distance ${r.distanceKm}km exceeds 2.0km radius`
        );
      }
    }
  });

  await test("GPS Radius Expansion (radius=10 returns >= radius=2)", async () => {
    const { token } = await loginAs("amit@cleanrohini.org", "password123");
    const resSmall = await apiRequest("GET", "/reports/for-ngo?radius=2", { token });
    const resLarge = await apiRequest("GET", "/reports/for-ngo?radius=10", { token });
    
    const countSmall = (resSmall.data.reports || []).length;
    const countLarge = (resLarge.data.reports || []).length;
    assert(
      countLarge >= countSmall,
      `Expected 10km radius (${countLarge}) to return >= 2km radius (${countSmall})`
    );
  });

  await test("NGO Volunteer Help Pledge (POST /helpers/:id/help)", async () => {
    assert(!!sampleReportId, "Sample report ID needed");
    const { token } = await loginAs("amit@cleanrohini.org", "password123");
    
    const res = await apiRequest("POST", `/helpers/${sampleReportId}/help`, {
      token,
      body: { action: "add" },
    });
    assert(res.ok, `Pledging help failed: ${res.data?.error || res.status}`);
  });

  await test("Verify Active NGO Pledges (GET /helpers/ngo/my-helping)", async () => {
    assert(!!sampleReportId, "Sample report ID needed");
    const { token } = await loginAs("amit@cleanrohini.org", "password123");
    
    const res = await apiRequest("GET", "/helpers/ngo/my-helping", { token });
    assert(res.ok, "GET my-helping should succeed");
    assert(Array.isArray(res.data), "Helping list must be an array");
    const found = res.data.some((item: any) => item.complaint.id === sampleReportId);
    assert(found, "Pledged report must appear in NGO's my-helping list");
  });

  return results;
}
