import { apiRequest, loginAs, assert, assertEqual, TestResult } from "../utils";

export async function runAuthTests(): Promise<TestResult[]> {
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

  await test("Citizen Login & Profile Verification", async () => {
    const { token, user } = await loginAs("vikram@gmail.com", "password123");
    assert(!!token, "Token should be returned");
    assertEqual(user.email, "vikram@gmail.com", "Email matches");
    assertEqual(user.role, "CITIZEN", "Role should be CITIZEN");
  });

  await test("Admin Login & Department Verification", async () => {
    const { token, user } = await loginAs("admin@jansamvedan.org", "password123");
    assert(!!token, "Token should be returned");
    assertEqual(user.role, "ADMIN", "Role should be ADMIN");
    assert(!!user.department, "Admin must have an assigned department");
  });

  await test("NGO Login & Service Area Verification", async () => {
    const { token, user } = await loginAs("amit@cleanrohini.org", "password123");
    assert(!!token, "Token should be returned");
    assertEqual(user.role, "NGO", "Role should be NGO");
    assertEqual(user.ngoStatus, "VERIFIED", "Seeded NGO should be VERIFIED");
    assert(!!user.serviceArea, "NGO should have service area assigned");
  });

  await test("Citizen Registration Flow", async () => {
    const rand = Math.floor(Math.random() * 90000 + 10000);
    const email = `test.citizen.${rand}@example.com`;
    const res = await apiRequest("POST", "/auth/register", {
      body: {
        name: "Test Citizen User",
        email,
        password: "password123",
        phone: "9876543210",
        address: "Sector 3, Rohini",
        role: "CITIZEN",
      },
    });
    assert(res.ok, `Registration should succeed: ${res.data?.error || res.status}`);
    assert(!!res.data.token, "Should return JWT token");
    assertEqual(res.data.user.role, "CITIZEN", "User role must be CITIZEN");
  });

  await test("NGO Registration Flow (Pending Status by Default)", async () => {
    const rand = Math.floor(Math.random() * 90000 + 10000);
    const email = `test.ngo.${rand}@example.org`;
    const res = await apiRequest("POST", "/auth/register", {
      body: {
        name: "Test NGO Lead",
        email,
        password: "password123",
        phone: "9876543211",
        address: "Sector 14, Rohini",
        organization: "Green Rohini Initiative",
        serviceArea: "Sector 14, Sector 15",
        role: "NGO",
      },
    });
    assert(res.ok, `NGO Registration should succeed: ${res.data?.error || res.status}`);
    assertEqual(res.data.user.role, "NGO", "User role must be NGO");
    assertEqual(res.data.user.ngoStatus, "PENDING", "New NGO registration must default to PENDING status");
  });

  await test("GET /auth/me Profile Verification with Token", async () => {
    const { token } = await loginAs("vikram@gmail.com", "password123");
    const res = await apiRequest("GET", "/auth/me", { token });
    assert(res.ok, "GET /auth/me should succeed with valid token");
    const profile = res.data.user || res.data;
    assertEqual(profile.email, "vikram@gmail.com", "Profile email matches");
  });

  await test("Rejection of Invalid Credentials (401)", async () => {
    const res = await apiRequest("POST", "/auth/login", {
      body: {
        email: "vikram@gmail.com",
        password: "wrong-password-12345",
      },
    });
    assertEqual(res.status, 401, "Invalid password must return HTTP 401");
  });

  await test("Rejection of Malformed / Missing Token (401)", async () => {
    const res = await apiRequest("GET", "/auth/me", {
      headers: { Authorization: "Bearer invalid.fake.jwt.token" },
    });
    assertEqual(res.status, 401, "Malformed token must return HTTP 401");
  });

  return results;
}
