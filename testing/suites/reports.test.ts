import { apiRequest, loginAs, assert, assertEqual, TestResult } from "../utils";

// Minimal 1x1 test png base64
const TEST_IMAGE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export async function runReportsTests(): Promise<TestResult[]> {
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

  let createdReportId: string | null = null;

  await test("Fetch Public & Seeded Reports (GET /reports/all)", async () => {
    const { token } = await loginAs("vikram@gmail.com", "password123");
    const res = await apiRequest("GET", "/reports/all", { token });
    assert(res.ok, "GET /reports/all should succeed");
    assert(Array.isArray(res.data), "Reports must be an array");
    assert(res.data.length >= 10, `Expected at least 10 seeded reports, found ${res.data.length}`);
    
    // Verify first report structure
    const sample = res.data[0];
    assert(!!sample.id, "Report has ID");
    assert(!!sample.title, "Report has title");
    assert(!!sample.category, "Report has category");
    assert(!!sample.status, "Report has status");
  });

  await test("Mandatory Photo Rejection Check (POST /reports without image)", async () => {
    const { token } = await loginAs("vikram@gmail.com", "password123");
    const res = await apiRequest("POST", "/reports", {
      token,
      body: {
        description: "Missing photo test description",
        address: "Sector 7, Rohini",
        latitude: 28.7052,
        longitude: 77.1184,
      },
    });
    assertEqual(res.status, 400, "Submitting without photo must return HTTP 400");
    assert(
      (res.data?.error || "").toLowerCase().includes("photo"),
      "Error message must specify that photo is mandatory"
    );
  });

  await test("Create New Civic Report with Mandatory Photo (POST /reports)", async () => {
    const { token } = await loginAs("vikram@gmail.com", "password123");
    const res = await apiRequest("POST", "/reports", {
      token,
      body: {
        title: "Deep Pothole on Main Ring Road",
        category: "Pothole",
        priority: "high",
        description: "Hazardous pothole causing vehicle damage near Sector 7 market intersection.",
        address: "Near Ring Road Crossing, Sector 7, Rohini, Delhi",
        latitude: 28.7052,
        longitude: 77.1184,
        isAnonymous: false,
        dataUrl: TEST_IMAGE_DATA_URL,
      },
    });
    assert(res.ok, `Report creation failed: ${res.data?.error || res.status}`);
    assert(!!res.data.id, "Report should have an ID");
    assertEqual(res.data.category, "Pothole", "Category matches");
    createdReportId = res.data.id;
  });

  await test("Fetch Single Report Details & History (GET /reports/:id)", async () => {
    assert(!!createdReportId, "Report ID must be available from creation step");
    const { token } = await loginAs("vikram@gmail.com", "password123");
    const res = await apiRequest("GET", `/reports/${createdReportId}`, { token });
    assert(res.ok, "GET /reports/:id should succeed");
    assertEqual(res.data.id, createdReportId, "Returned report matches requested ID");
    assert(Array.isArray(res.data.statusHistory || []), "Status history must be an array");
  });

  await test("Citizen Crowd-Verification / Upvote (POST /reports/:id/confirm)", async () => {
    assert(!!createdReportId, "Report ID must be available");
    // Use a different seeded citizen to confirm/upvote the report
    const { token } = await loginAs("neha.gupta@yahoo.com", "password123");
    const res = await apiRequest("POST", `/reports/${createdReportId}/confirm`, { token });
    assert(res.ok, `Confirmation failed: ${res.data?.error || res.status}`);
    const count = res.data.report?.confirmationsCount ?? res.data.confirmationsCount;
    assert(count >= 1, "Confirmation count should increment");
  });

  await test("Duplicate Detection & Haversine Proximity (POST /reports/find-duplicates)", async () => {
    const { token } = await loginAs("rahul.jain@outlook.com", "password123");
    // Query location within 50 meters of the pothole created above
    const res = await apiRequest("POST", "/reports/find-duplicates", {
      token,
      body: {
        latitude: 28.7053, // ~15 meters away
        longitude: 77.1185,
        address: "Sector 7, Rohini",
      },
    });
    assert(res.ok, "find-duplicates endpoint should respond OK");
    assert(Array.isArray(res.data), "Result must be an array of nearby candidates");
    const found = res.data.some((r: any) => r.id === createdReportId);
    assert(found, "Newly created report should be detected in proximity radius (< 150m)");
  });

  await test("Fetch Citizen Own Reports (GET /reports/me)", async () => {
    const { token } = await loginAs("vikram@gmail.com", "password123");
    const res = await apiRequest("GET", "/reports/me", { token });
    assert(res.ok, "GET /reports/me should succeed");
    assert(Array.isArray(res.data), "Own reports must be an array");
    const ownReport = res.data.find((r: any) => r.id === createdReportId);
    assert(!!ownReport, "Newly created report should appear in citizen's own report list");
  });

  return results;
}
