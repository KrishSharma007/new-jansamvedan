import { FRONTEND_BASE, assert, assertEqual, TestResult } from "../utils";

export async function runFrontendRoutesTests(): Promise<TestResult[]> {
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

  const routes = [
    { path: "/", name: "Landing Page (/)" },
    { path: "/login", name: "Sign In Page (/login)" },
    { path: "/signup", name: "Registration Page (/signup)" },
    { path: "/citizen/dashboard", name: "Citizen Dashboard (/citizen/dashboard)" },
    { path: "/report", name: "Report Issue Submission (/report)" },
    { path: "/map", name: "Interactive GIS Map (/map)" },
    { path: "/my-reports", name: "Citizen My Reports (/my-reports)" },
    { path: "/ngo/dashboard", name: "NGO Action Dashboard (/ngo/dashboard)" },
    { path: "/admin/dashboard", name: "Admin Management Dashboard (/admin/dashboard)" },
    { path: "/admin/ngos", name: "Admin NGO Directory (/admin/ngos)" },
  ];

  for (const r of routes) {
    await test(`Frontend Route Availability: ${r.name}`, async () => {
      const res = await fetch(`${FRONTEND_BASE}${r.path}`);
      assertEqual(res.status, 200, `Expected HTTP 200 for ${r.path}`);
      const text = await res.text();
      assert(text.length > 100, `Page ${r.path} content should not be empty`);
    });
  }

  return results;
}
